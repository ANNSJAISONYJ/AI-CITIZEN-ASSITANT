import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, Mic, Square, Sparkles, Trash2, Bot, User } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { theme } from '@/lib/theme';
import { generateAssistantReply } from '@/lib/eligibility';
import { ChatMessage, Language } from '@/types';

// Web Speech API types (web platform only)
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
    SpeechSynthesisUtterance?: any;
  }
}

export default function AssistantScreen() {
  const { t, lang } = useI18n();
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(50)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setMessages(data as ChatMessage[]);
        } else {
          setMessages([{
            id: 'greeting',
            user_id: user.id,
            role: 'assistant',
            content: t('assistantGreeting'),
            language: lang,
            created_at: new Date().toISOString(),
          }]);
        }
      });
  }, [user]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, thinking]);

  const persistMessage = async (role: 'user' | 'assistant', content: string) => {
    if (!user) return;
    await supabase.from('chat_messages').insert({
      user_id: user.id,
      role,
      content,
      language: lang,
    });
  };

  const send = async (text: string) => {
    if (!text.trim() || thinking) return;
    setError(null);
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      user_id: user?.id || '',
      role: 'user',
      content: text,
      language: lang,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setThinking(true);
    await persistMessage('user', text);

    try {
      const reply = await generateAssistantReply(text, profile, lang);
      const aiMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        user_id: user?.id || '',
        role: 'assistant',
        content: reply,
        language: lang,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMsg]);
      await persistMessage('assistant', reply);
      if (Platform.OS === 'web') speakText(reply);
    } catch (e: any) {
      setError(t('error'));
    }
    setThinking(false);
  };

  const speakText = (text: string) => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new (window as any).SpeechSynthesisUtterance(text);
    utter.lang = lang === 'hi' ? 'hi-IN' : lang === 'ta' ? 'ta-IN' : 'en-IN';
    window.speechSynthesis.speak(utter);
  };

  const startListening = () => {
    if (Platform.OS !== 'web') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError('Voice input not supported on this browser');
      return;
    }
    const recognition = new SR();
    recognition.lang = lang === 'hi' ? 'hi-IN' : lang === 'ta' ? 'ta-IN' : 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
      send(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const stopSpeaking = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const clearChat = async () => {
    if (!user) return;
    await supabase.from('chat_messages').delete().eq('user_id', user.id);
    setMessages([{
      id: 'greeting',
      user_id: user.id,
      role: 'assistant',
      content: t('assistantGreeting'),
      language: lang,
      created_at: new Date().toISOString(),
    }]);
  };

  const suggestions: Record<Language, string[]> = {
    en: ['What scholarships am I eligible for?', 'How do I apply for PM-KISAN?', 'What pension schemes are available?'],
    hi: ['मैं किन छात्रवृत्तियों के लिए पात्र हूं?', 'पीएम-किसान के लिए कैसे आवेदन करें?', 'कौन सी पेंशन योजनाएं उपलब्ध हैं?'],
    ta: ['நான் எந்த உதவித்தொகைக்கு தகுதியானவன்?', 'பிஎம்-கிசான் எப்படி விண்ணப்பிப்பது?', 'என்ன ஓய்வூதிய திட்டங்கள் உள்ளன?'],
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.botAvatar}>
              <Sparkles color="#fff" size={20} />
            </View>
            <View>
              <Text style={styles.headerTitle}>{t('aiAssistant')}</Text>
              <Text style={styles.headerSubtitle}>AI Government Companion</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={stopSpeaking}>
              <Square color={theme.colors.neutral[500]} size={16} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={clearChat}>
              <Trash2 color={theme.colors.neutral[500]} size={16} />
            </TouchableOpacity>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBar}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: theme.spacing.lg, gap: 12 }}>
          {messages.map(m => <ChatBubble key={m.id} message={m} />)}
          {thinking ? (
            <View style={styles.thinkingBubble}>
              <View style={styles.dotsRow}>
                <View style={[styles.dot, styles.dot1]} />
                <View style={[styles.dot, styles.dot2]} />
                <View style={[styles.dot, styles.dot3]} />
              </View>
            </View>
          ) : null}

          {messages.length <= 1 ? (
            <View style={styles.suggestionsWrap}>
              <Text style={styles.suggestionsTitle}>{t('suggestedQuestions')}</Text>
              {suggestions[lang].map((s, i) => (
                <TouchableOpacity key={i} style={styles.suggestionChip} onPress={() => send(s)}>
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.inputBar}>
          {Platform.OS === 'web' ? (
            <TouchableOpacity
              style={[styles.micBtn, listening && styles.micBtnActive]}
              onPress={listening ? stopListening : startListening}
            >
              <Mic color={listening ? '#fff' : theme.colors.neutral[500]} size={20} />
            </TouchableOpacity>
          ) : null}
          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              value={listening ? t('listening') : input}
              onChangeText={setInput}
              placeholder={t('typeMessage')}
              placeholderTextColor={theme.colors.textMuted}
              editable={!listening}
              multiline
            />
            <TouchableOpacity style={styles.sendBtn} onPress={() => send(input)} disabled={!input.trim() || thinking}>
              <Send color={input.trim() && !thinking ? '#fff' : theme.colors.neutral[400]} size={18} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
      <View style={[styles.bubbleAvatar, isUser && styles.bubbleAvatarUser]}>
        {isUser ? <User color="#fff" size={14} /> : <Bot color="#fff" size={14} />}
      </View>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.bubbleText, isUser ? styles.userBubbleText : styles.aiBubbleText]}>{message.content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: theme.spacing.lg, paddingVertical: 14, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  botAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: theme.colors.primary[600], alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.text, fontFamily: 'Inter-Bold' },
  headerSubtitle: { fontSize: 11, color: theme.colors.textSecondary, fontFamily: 'Inter-Regular' },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.neutral[100], alignItems: 'center', justifyContent: 'center' },

  errorBar: { backgroundColor: '#fef2f2', paddingHorizontal: theme.spacing.lg, paddingVertical: 8 },
  errorText: { color: theme.colors.error, fontSize: theme.fontSize.sm, fontFamily: 'Inter-Regular' },

  bubbleRow: { flexDirection: 'row', gap: 8, maxWidth: '85%' },
  bubbleRowUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  bubbleAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.primary[600], alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  bubbleAvatarUser: { backgroundColor: theme.colors.neutral[400] },
  bubble: { borderRadius: theme.radius.lg, padding: 12, flex: 1 },
  aiBubble: { backgroundColor: theme.colors.surface, ...theme.shadows.sm },
  userBubble: { backgroundColor: theme.colors.primary[600] },
  bubbleText: { fontSize: theme.fontSize.md, lineHeight: 21, fontFamily: 'Inter-Regular' },
  aiBubbleText: { color: theme.colors.text },
  userBubbleText: { color: '#fff' },

  thinkingBubble: { alignSelf: 'flex-start', backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 16, ...theme.shadows.sm },
  dotsRow: { flexDirection: 'row', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.neutral[300] },
  dot1: { opacity: 0.4 },
  dot2: { opacity: 0.7 },
  dot3: { opacity: 1 },

  suggestionsWrap: { marginTop: 8, gap: 8 },
  suggestionsTitle: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, fontWeight: theme.fontWeight.semibold, fontFamily: 'Inter-SemiBold' },
  suggestionChip: { backgroundColor: theme.colors.primary[50], borderRadius: theme.radius.lg, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: theme.colors.primary[100] },
  suggestionText: { color: theme.colors.primary[700], fontSize: theme.fontSize.md, fontFamily: 'Inter-Regular' },

  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: theme.spacing.lg, paddingVertical: 10, backgroundColor: theme.colors.surface, borderTopWidth: 1, borderTopColor: theme.colors.border, gap: 8 },
  micBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.neutral[100], alignItems: 'center', justifyContent: 'center' },
  micBtnActive: { backgroundColor: theme.colors.error },
  inputBox: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', backgroundColor: theme.colors.neutral[50], borderRadius: theme.radius.lg, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: theme.colors.border, gap: 8 },
  textInput: { flex: 1, fontSize: theme.fontSize.md, color: theme.colors.text, maxHeight: 100, paddingVertical: 10, fontFamily: 'Inter-Regular' },
  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.primary[600], alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
});
