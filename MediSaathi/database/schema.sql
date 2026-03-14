-- MediSaathi Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  user_type TEXT CHECK (user_type IN ('patient', 'doctor', 'hospital')) NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Family members table
CREATE TABLE public.family_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')) NOT NULL,
  phone TEXT,
  emergency_contact BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Doctors table
CREATE TABLE public.doctors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  specialty TEXT NOT NULL,
  license_number TEXT UNIQUE NOT NULL,
  experience_years INTEGER DEFAULT 0,
  education TEXT,
  hospital_id UUID,
  consultation_fee DECIMAL(10,2),
  available_days TEXT[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  available_hours TEXT DEFAULT '09:00-17:00',
  bio TEXT,
  rating DECIMAL(2,1) DEFAULT 0.0,
  total_patients INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hospitals table
CREATE TABLE public.hospitals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  website TEXT,
  license_number TEXT UNIQUE NOT NULL,
  total_beds INTEGER DEFAULT 0,
  available_beds INTEGER DEFAULT 0,
  departments TEXT[] DEFAULT ARRAY[]::TEXT[],
  services TEXT[] DEFAULT ARRAY[]::TEXT[],
  emergency_services BOOLEAN DEFAULT TRUE,
  rating DECIMAL(2,1) DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health records table
CREATE TABLE public.health_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT CHECK (type IN ('lab_report', 'prescription', 'xray', 'scan', 'consultation', 'other')) NOT NULL,
  file_url TEXT,
  file_type TEXT,
  content TEXT,
  doctor_id UUID REFERENCES public.doctors(id),
  hospital_id UUID REFERENCES public.hospitals(id),
  date_recorded DATE NOT NULL,
  ai_summary TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_critical BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vital signs table
CREATE TABLE public.vital_signs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('blood_pressure', 'heart_rate', 'temperature', 'weight', 'height', 'blood_sugar', 'oxygen_saturation')) NOT NULL,
  value TEXT NOT NULL,
  unit TEXT NOT NULL,
  notes TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments table
CREATE TABLE public.appointments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
  hospital_id UUID REFERENCES public.hospitals(id),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration INTEGER DEFAULT 30,
  type TEXT CHECK (type IN ('consultation', 'follow_up', 'emergency', 'telemedicine')) NOT NULL,
  is_urgent BOOLEAN DEFAULT FALSE,
  status TEXT CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')) DEFAULT 'scheduled',
  reason TEXT NOT NULL,
  notes TEXT,
  prescription_id UUID,
  fee DECIMAL(10,2),
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'refunded')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prescriptions table
CREATE TABLE public.prescriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id),
  medications JSONB NOT NULL,
  instructions TEXT,
  valid_until DATE NOT NULL,
  status TEXT CHECK (status IN ('active', 'expired', 'cancelled')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health wallet table
CREATE TABLE public.health_wallet (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  transaction_type TEXT CHECK (transaction_type IN ('expense', 'income', 'insurance_claim')) NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  date_occurred DATE NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id),
  hospital_id UUID REFERENCES public.hospitals(id),
  appointment_id UUID REFERENCES public.appointments(id),
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI insights table
CREATE TABLE public.ai_insights (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE,
  insight_type TEXT CHECK (insight_type IN ('risk_prediction', 'health_trend', 'medication_reminder', 'checkup_due')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  action_required BOOLEAN DEFAULT FALSE,
  dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_family_members_user_id ON public.family_members(user_id);
CREATE INDEX idx_doctors_user_id ON public.doctors(user_id);
CREATE INDEX idx_doctors_specialty ON public.doctors(specialty);
CREATE INDEX idx_hospitals_user_id ON public.hospitals(user_id);
CREATE INDEX idx_health_records_user_id ON public.health_records(user_id);
CREATE INDEX idx_health_records_date ON public.health_records(date_recorded DESC);
CREATE INDEX idx_vital_signs_user_id ON public.vital_signs(user_id);
CREATE INDEX idx_vital_signs_type ON public.vital_signs(type);
CREATE INDEX idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_prescriptions_patient_id ON public.prescriptions(patient_id);
CREATE INDEX idx_prescriptions_doctor_id ON public.prescriptions(doctor_id);
CREATE INDEX idx_health_wallet_user_id ON public.health_wallet(user_id);
CREATE INDEX idx_ai_insights_user_id ON public.ai_insights(user_id);

-- Add foreign key constraint for doctors.hospital_id after hospitals table is created
ALTER TABLE public.doctors ADD CONSTRAINT fk_doctors_hospital 
  FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id);

-- Add foreign key constraint for appointments.prescription_id
ALTER TABLE public.appointments ADD CONSTRAINT fk_appointments_prescription 
  FOREIGN KEY (prescription_id) REFERENCES public.prescriptions(id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vital_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Family members policies
CREATE POLICY "Users can view own family members" ON public.family_members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own family members" ON public.family_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own family members" ON public.family_members
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own family members" ON public.family_members
  FOR DELETE USING (auth.uid() = user_id);

-- Health records policies
CREATE POLICY "Users can view own health records" ON public.health_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health records" ON public.health_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health records" ON public.health_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Doctors can view patient health records" ON public.health_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.doctors d 
      WHERE d.user_id = auth.uid() AND d.id = health_records.doctor_id
    )
  );

-- Vital signs policies
CREATE POLICY "Users can manage own vital signs" ON public.vital_signs
  FOR ALL USING (auth.uid() = user_id);

-- Appointments policies
CREATE POLICY "Patients can view own appointments" ON public.appointments
  FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can view their appointments" ON public.appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.doctors d 
      WHERE d.user_id = auth.uid() AND d.id = appointments.doctor_id
    )
  );

-- Prescriptions policies
CREATE POLICY "Patients can view own prescriptions" ON public.prescriptions
  FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can manage prescriptions they created" ON public.prescriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.doctors d 
      WHERE d.user_id = auth.uid() AND d.id = prescriptions.doctor_id
    )
  );

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_family_members_updated_at BEFORE UPDATE ON public.family_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON public.doctors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hospitals_updated_at BEFORE UPDATE ON public.hospitals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_records_updated_at BEFORE UPDATE ON public.health_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON public.prescriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();