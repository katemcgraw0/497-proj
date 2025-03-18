import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';

interface UserSettingsRow {
  user_id: string;       // or 'id' if your column is actually named 'id'
  vegan: boolean;
  gluten_free: boolean;
  vegetarian: boolean;
  dairy_free: boolean;
  nut_free: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const session = useSession();
  const supabase = useSupabaseClient();

  const [settings, setSettings] = useState<UserSettingsRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!session) {
        router.push('/login');
        return;
      }
      setLoading(true);

      // 1. Attempt to fetch existing settings via maybeSingle()
      const { data, error } = await supabase
        .from('UserSettings')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching settings:', error);
        setLoading(false);
        return;
      }

      // 2. If there's no row for this user, create one
      if (!data) {
        console.log('No row found for user_id:', session.user.id, ' → Creating new row.');
        const { data: newRow, error: insertError } = await supabase
          .from('UserSettings')
          .insert([
            {
              user_id: session.user.id, // match your PK column name
              vegan: false,
              gluten_free: false,
              vegetarian: false,
              dairy_free: false,
              nut_free: false,
            },
          ])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating new settings row:', insertError);
          setLoading(false);
          return;
        }
        setSettings(newRow as UserSettingsRow);
        setLoading(false);
        return;
      }

      // 3. If data already exists, store it in state
      console.log('Fetched existing settings:', data);
      setSettings(data as UserSettingsRow);
      setLoading(false);
    };

    fetchSettings();
  }, [session, supabase, router]);

  // Toggle logic
  const handleToggle = async (field: keyof UserSettingsRow) => {
    if (!settings) return;

    const updatedValue = !settings[field];
    const updatedSettings = { ...settings, [field]: updatedValue };
    setSettings(updatedSettings); 

    const { error } = await supabase
      .from('UserSettings')
      .update({ [field]: updatedValue })
      .eq('user_id', settings.user_id);

    if (error) {
      console.error('Error updating settings:', error);
      setSettings(settings);
    }
  };

  const renderSettingButton = (label: string, field: keyof UserSettingsRow) => {
    if (!settings) return null;
    const value = settings[field];
    const bgClass = value ? 'bg-green-500' : 'bg-red-500';
    const displayIcon = value ? '✓' : '✕';

    return (
      <button
        key={field}
        onClick={() => handleToggle(field)}
        className={`${bgClass} text-white rounded-lg px-4 py-2 w-full flex items-center justify-center space-x-2`}
      >
        <span>{label}</span>
        <span className="font-bold">{displayIcon}</span>
      </button>
    );
  };

  if (loading) {
    return <p className="p-6">Loading settings...</p>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-6">
      <h1 className="text-xl font-semibold mb-4">Select Dietary Restrictions</h1>

      <div className="space-y-4 w-full max-w-sm">
        {renderSettingButton('Dairy Free', 'dairy_free')}
        {renderSettingButton('Vegan', 'vegan')}
        {renderSettingButton('Nut Free', 'nut_free')}
        {renderSettingButton('Vegetarian', 'vegetarian')}
        {renderSettingButton('Gluten Free', 'gluten_free')}
      </div>

      <button
        onClick={() => router.push('/')}
        className="mt-10 bg-gray-300 rounded-full px-6 py-2 text-black"
      >
        Back to Home
      </button>
    </div>
  );
}
