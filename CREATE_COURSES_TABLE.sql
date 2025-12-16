-- Create enrollments and courses tables with proper structure
-- This script creates both tables needed for the course management system

-- Drop tables if exists (for clean setup) - drop in reverse dependency order
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.enrollments CASCADE;

-- Helper function to check if user is admin (needed for RLS policies)
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.secureshare_users 
        WHERE user_id = auth.uid() 
        AND role = 'Admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create enrollments table first (courses table references it in RLS policies)
CREATE TABLE IF NOT EXISTS public.enrollments (
    enrollment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL, -- Will reference courses.course_id after it's created
    student_id UUID NOT NULL REFERENCES public.secureshare_users(user_id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'Active',
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_student_course UNIQUE (course_id, student_id),
    CONSTRAINT valid_status CHECK (status IN ('Active', 'Inactive', 'Dropped'))
);

-- Create index on course_id for faster queries
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);

-- Create index on student_id for faster queries
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.enrollments(student_id);

-- Enable Row Level Security for enrollments (policies will be created after courses table)
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Now create courses table (needed before enrollments RLS policies)

-- Create courses table
CREATE TABLE IF NOT EXISTS public.courses (
    course_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.secureshare_users(user_id) ON DELETE CASCADE,
    subject_code VARCHAR(50) NOT NULL,
    subject_name VARCHAR(255) NOT NULL,
    schedule_days TEXT[] NOT NULL, -- Array of days: ['Mon', 'Tue', 'Wed', etc.]
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    semester VARCHAR(50) DEFAULT 'Current',
    academic_year VARCHAR(10) NOT NULL,
    enrolled_students INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    CONSTRAINT valid_days CHECK (array_length(schedule_days, 1) > 0)
);

-- Add foreign key constraint to enrollments table now that courses exists
ALTER TABLE public.enrollments 
    ADD CONSTRAINT fk_enrollments_course_id 
    FOREIGN KEY (course_id) 
    REFERENCES public.courses(course_id) 
    ON DELETE CASCADE;

-- Create index on teacher_id for faster queries
CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON public.courses(teacher_id);

-- Create index on subject_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_courses_subject_code ON public.courses(subject_code);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_courses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_courses_updated_at ON public.courses;
CREATE TRIGGER trigger_update_courses_updated_at
    BEFORE UPDATE ON public.courses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_courses_updated_at();

-- Enable Row Level Security
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is teacher of a course (bypasses RLS to avoid recursion)
-- Must be created AFTER courses table exists
-- SECURITY DEFINER allows this function to bypass RLS when querying courses table
CREATE OR REPLACE FUNCTION public.is_course_teacher(course_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.courses
        WHERE course_id = course_uuid
        AND teacher_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is enrolled in a course (bypasses RLS to avoid recursion)
-- Must be created AFTER enrollments table exists
-- SECURITY DEFINER allows this function to bypass RLS when querying enrollments table
CREATE OR REPLACE FUNCTION public.is_student_enrolled(course_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.enrollments
        WHERE course_id = course_uuid
        AND student_id = auth.uid()
        AND status = 'Active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Teachers can view their own courses" ON public.courses;
DROP POLICY IF EXISTS "Teachers can insert their own courses" ON public.courses;
DROP POLICY IF EXISTS "Teachers can update their own courses" ON public.courses;
DROP POLICY IF EXISTS "Teachers can delete their own courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can view all courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can manage all courses" ON public.courses;
DROP POLICY IF EXISTS "Students can view courses they are enrolled in" ON public.courses;

-- RLS Policy: Teachers can view their own courses
CREATE POLICY "Teachers can view their own courses"
    ON public.courses
    FOR SELECT
    USING (
        teacher_id = auth.uid()
        OR
        is_admin_user()
    );

-- RLS Policy: Teachers can insert their own courses
CREATE POLICY "Teachers can insert their own courses"
    ON public.courses
    FOR INSERT
    WITH CHECK (
        teacher_id = auth.uid()
        OR
        is_admin_user()
    );

-- RLS Policy: Teachers can update their own courses
CREATE POLICY "Teachers can update their own courses"
    ON public.courses
    FOR UPDATE
    USING (
        teacher_id = auth.uid()
        OR
        is_admin_user()
    )
    WITH CHECK (
        teacher_id = auth.uid()
        OR
        is_admin_user()
    );

-- RLS Policy: Teachers can delete their own courses
CREATE POLICY "Teachers can delete their own courses"
    ON public.courses
    FOR DELETE
    USING (
        teacher_id = auth.uid()
        OR
        is_admin_user()
    );

-- RLS Policy: Students can view courses they are enrolled in
CREATE POLICY "Students can view courses they are enrolled in"
    ON public.courses
    FOR SELECT
    USING (
        is_student_enrolled(courses.course_id)
    );

-- Grant necessary permissions
GRANT ALL ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;

-- Now create enrollments RLS policies (courses table exists now)
-- Drop existing enrollments policies if they exist
DROP POLICY IF EXISTS "Students can view their own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Teachers can view enrollments for their courses" ON public.enrollments;
DROP POLICY IF EXISTS "Teachers can insert enrollments for their courses" ON public.enrollments;
DROP POLICY IF EXISTS "Teachers can update enrollments for their courses" ON public.enrollments;
DROP POLICY IF EXISTS "Teachers can delete enrollments for their courses" ON public.enrollments;
DROP POLICY IF EXISTS "Admins can manage all enrollments" ON public.enrollments;

-- RLS Policy: Students can view their own enrollments
CREATE POLICY "Students can view their own enrollments"
    ON public.enrollments
    FOR SELECT
    USING (
        student_id = auth.uid()
        OR
        is_admin_user()
    );

-- RLS Policy: Teachers can view enrollments for their courses
CREATE POLICY "Teachers can view enrollments for their courses"
    ON public.enrollments
    FOR SELECT
    USING (
        is_course_teacher(enrollments.course_id)
        OR
        is_admin_user()
    );

-- RLS Policy: Teachers can insert enrollments for their courses
CREATE POLICY "Teachers can insert enrollments for their courses"
    ON public.enrollments
    FOR INSERT
    WITH CHECK (
        is_course_teacher(enrollments.course_id)
        OR
        is_admin_user()
    );

-- RLS Policy: Teachers can update enrollments for their courses
CREATE POLICY "Teachers can update enrollments for their courses"
    ON public.enrollments
    FOR UPDATE
    USING (
        is_course_teacher(enrollments.course_id)
        OR
        is_admin_user()
    )
    WITH CHECK (
        is_course_teacher(enrollments.course_id)
        OR
        is_admin_user()
    );

-- RLS Policy: Teachers can delete enrollments for their courses
CREATE POLICY "Teachers can delete enrollments for their courses"
    ON public.enrollments
    FOR DELETE
    USING (
        is_course_teacher(enrollments.course_id)
        OR
        is_admin_user()
    );

-- Grant necessary permissions for enrollments
GRANT ALL ON public.enrollments TO authenticated;
GRANT ALL ON public.enrollments TO service_role;

