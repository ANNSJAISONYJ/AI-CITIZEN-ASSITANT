import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Document, Application, Notification, Complaint, FamilyMember, Scheme } from '@/types';

export function useUserData() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [docs, apps, notifs, comps, fam, sch] = await Promise.all([
      supabase.from('documents').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('applications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('complaints').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('family_members').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('schemes').select('*').eq('is_active', true).order('name'),
    ]);
    setDocuments((docs.data as Document[]) || []);
    setApplications((apps.data as Application[]) || []);
    setNotifications((notifs.data as Notification[]) || []);
    setComplaints((comps.data as Complaint[]) || []);
    setFamilyMembers((fam.data as FamilyMember[]) || []);
    setSchemes((sch.data as Scheme[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return { documents, applications, notifications, complaints, familyMembers, schemes, loading, reload: loadAll };
}
