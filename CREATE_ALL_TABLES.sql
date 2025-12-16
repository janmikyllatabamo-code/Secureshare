-- ============================================================================
-- SecureShare Complete Database Schema
-- This script creates all tables needed for the SecureShare system
-- ============================================================================

-- ============================================================================
-- PART 1: Helper Functions (must be created first)
-- ============================================================================

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

-- ============================================================================
-- PART 2: Drop existing tables (if needed for clean setup)
-- ============================================================================

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS public.submissions CASCADE;
DROP TABLE IF EXISTS public.assignments CASCADE;
DROP TABLE IF EXISTS public.shared_access CASCADE;
DROP TABLE IF EXISTS public.activity_log CASCADE;
DROP TABLE IF EXISTS public.files CASCADE;
DROP TABLE IF EXISTS public.enrollments CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;

-- ============================================================================
-- PART 3: Create enrollments table (needed before courses)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.enrollments (
    enrollment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL, -- Will reference courses.course_id after it's created
    student_id UUID NOT NULL REFERENCES public.secureshare_users(user_id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'Active',
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_student_course UNIQUE (course_id, student_id),
    CONSTRAINT valid_status CHECK (status IN ('Active', 'Inactive', 'Dropped'))
);

CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.enrollments(student_id);
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 4: Create courses table
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON public.courses(teacher_id);
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

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 5: Helper functions for courses/enrollments RLS (must be after tables)
-- ============================================================================

-- Helper function to check if user is teacher of a course (bypasses RLS to avoid recursion)
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

-- ============================================================================
-- PART 6: RLS Policies for courses
-- ============================================================================

DROP POLICY IF EXISTS "Teachers can view their own courses" ON public.courses;
DROP POLICY IF EXISTS "Teachers can insert their own courses" ON public.courses;
DROP POLICY IF EXISTS "Teachers can update their own courses" ON public.courses;
DROP POLICY IF EXISTS "Teachers can delete their own courses" ON public.courses;
DROP POLICY IF EXISTS "Students can view courses they are enrolled in" ON public.courses;

CREATE POLICY "Teachers can view their own courses"
    ON public.courses FOR SELECT
    USING (teacher_id = auth.uid() OR is_admin_user());

CREATE POLICY "Teachers can insert their own courses"
    ON public.courses FOR INSERT
    WITH CHECK (teacher_id = auth.uid() OR is_admin_user());

CREATE POLICY "Teachers can update their own courses"
    ON public.courses FOR UPDATE
    USING (teacher_id = auth.uid() OR is_admin_user())
    WITH CHECK (teacher_id = auth.uid() OR is_admin_user());

CREATE POLICY "Teachers can delete their own courses"
    ON public.courses FOR DELETE
    USING (teacher_id = auth.uid() OR is_admin_user());

CREATE POLICY "Students can view courses they are enrolled in"
    ON public.courses FOR SELECT
    USING (is_student_enrolled(courses.course_id));

GRANT ALL ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;

-- ============================================================================
-- PART 7: RLS Policies for enrollments
-- ============================================================================

DROP POLICY IF EXISTS "Students can view their own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Teachers can view enrollments for their courses" ON public.enrollments;
DROP POLICY IF EXISTS "Teachers can insert enrollments for their courses" ON public.enrollments;
DROP POLICY IF EXISTS "Teachers can update enrollments for their courses" ON public.enrollments;
DROP POLICY IF EXISTS "Teachers can delete enrollments for their courses" ON public.enrollments;

CREATE POLICY "Students can view their own enrollments"
    ON public.enrollments FOR SELECT
    USING (student_id = auth.uid() OR is_admin_user());

CREATE POLICY "Teachers can view enrollments for their courses"
    ON public.enrollments FOR SELECT
    USING (is_course_teacher(enrollments.course_id) OR is_admin_user());

CREATE POLICY "Teachers can insert enrollments for their courses"
    ON public.enrollments FOR INSERT
    WITH CHECK (is_course_teacher(enrollments.course_id) OR is_admin_user());

CREATE POLICY "Teachers can update enrollments for their courses"
    ON public.enrollments FOR UPDATE
    USING (is_course_teacher(enrollments.course_id) OR is_admin_user())
    WITH CHECK (is_course_teacher(enrollments.course_id) OR is_admin_user());

CREATE POLICY "Teachers can delete enrollments for their courses"
    ON public.enrollments FOR DELETE
    USING (is_course_teacher(enrollments.course_id) OR is_admin_user());

GRANT ALL ON public.enrollments TO authenticated;
GRANT ALL ON public.enrollments TO service_role;

-- ============================================================================
-- PART 8: Create assignments table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.assignments (
    assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id BIGINT, -- For backward compatibility (can be set manually or via trigger)
    course_id UUID NOT NULL REFERENCES public.courses(course_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    due_time TIME,
    max_points INTEGER DEFAULT 100,
    material_url TEXT,
    material_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    submissions INTEGER DEFAULT 0,
    total_students INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_status CHECK (status IN ('active', 'completed', 'cancelled'))
);

-- Trigger to auto-generate id if not provided
CREATE OR REPLACE FUNCTION public.set_assignment_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.id IS NULL THEN
        NEW.id := EXTRACT(EPOCH FROM NOW())::BIGINT * 1000;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_assignment_id ON public.assignments;
CREATE TRIGGER trigger_set_assignment_id
    BEFORE INSERT ON public.assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.set_assignment_id();

CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON public.assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON public.assignments(due_date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_assignments_updated_at ON public.assignments;
CREATE TRIGGER trigger_update_assignments_updated_at
    BEFORE UPDATE ON public.assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_assignments_updated_at();

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assignments
DROP POLICY IF EXISTS "Teachers can view assignments for their courses" ON public.assignments;
DROP POLICY IF EXISTS "Teachers can insert assignments for their courses" ON public.assignments;
DROP POLICY IF EXISTS "Teachers can update assignments for their courses" ON public.assignments;
DROP POLICY IF EXISTS "Teachers can delete assignments for their courses" ON public.assignments;
DROP POLICY IF EXISTS "Students can view assignments for enrolled courses" ON public.assignments;

CREATE POLICY "Teachers can view assignments for their courses"
    ON public.assignments FOR SELECT
    USING (is_course_teacher(assignments.course_id) OR is_admin_user());

CREATE POLICY "Teachers can insert assignments for their courses"
    ON public.assignments FOR INSERT
    WITH CHECK (is_course_teacher(assignments.course_id) OR is_admin_user());

CREATE POLICY "Teachers can update assignments for their courses"
    ON public.assignments FOR UPDATE
    USING (is_course_teacher(assignments.course_id) OR is_admin_user())
    WITH CHECK (is_course_teacher(assignments.course_id) OR is_admin_user());

CREATE POLICY "Teachers can delete assignments for their courses"
    ON public.assignments FOR DELETE
    USING (is_course_teacher(assignments.course_id) OR is_admin_user());

CREATE POLICY "Students can view assignments for enrolled courses"
    ON public.assignments FOR SELECT
    USING (is_student_enrolled(assignments.course_id));

GRANT ALL ON public.assignments TO authenticated;
GRANT ALL ON public.assignments TO service_role;

-- ============================================================================
-- PART 9: Create submissions table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.submissions (
    submission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(assignment_id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(course_id) ON DELETE CASCADE, -- For backward compatibility
    student_id UUID NOT NULL REFERENCES public.secureshare_users(user_id) ON DELETE CASCADE,
    student_email VARCHAR(255), -- For backward compatibility
    student_name VARCHAR(255), -- For backward compatibility
    file_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT, -- For backward compatibility
    file_size BIGINT,
    file_size_bytes BIGINT, -- For backward compatibility
    bucket VARCHAR(100),
    path TEXT, -- For backward compatibility (same as file_path)
    status VARCHAR(20) DEFAULT 'pending',
    grade INTEGER,
    feedback TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    graded_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_student_assignment UNIQUE (assignment_id, student_id),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'graded', 'returned')),
    CONSTRAINT valid_grade CHECK (grade IS NULL OR (grade >= 0 AND grade <= 1000))
);

CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON public.submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON public.submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is student of an assignment's course
CREATE OR REPLACE FUNCTION public.is_assignment_student(assignment_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.assignments a
        JOIN public.enrollments e ON e.course_id = a.course_id
        WHERE a.assignment_id = assignment_uuid
        AND e.student_id = auth.uid()
        AND e.status = 'Active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for submissions
DROP POLICY IF EXISTS "Students can view their own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Students can insert their own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Students can update their own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Teachers can view submissions for their courses" ON public.submissions;
DROP POLICY IF EXISTS "Teachers can update submissions for their courses" ON public.submissions;

CREATE POLICY "Students can view their own submissions"
    ON public.submissions FOR SELECT
    USING (student_id = auth.uid() OR is_admin_user());

CREATE POLICY "Students can insert their own submissions"
    ON public.submissions FOR INSERT
    WITH CHECK (
        student_id = auth.uid() 
        AND is_assignment_student(submissions.assignment_id)
    );

CREATE POLICY "Students can update their own submissions"
    ON public.submissions FOR UPDATE
    USING (student_id = auth.uid())
    WITH CHECK (
        student_id = auth.uid()
        AND (status = 'pending' OR is_admin_user()) -- Only pending submissions can be updated by students
    );

CREATE POLICY "Teachers can view submissions for their courses"
    ON public.submissions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.assignments a
            WHERE a.assignment_id = submissions.assignment_id
            AND is_course_teacher(a.course_id)
        )
        OR is_admin_user()
    );

CREATE POLICY "Teachers can update submissions for their courses"
    ON public.submissions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.assignments a
            WHERE a.assignment_id = submissions.assignment_id
            AND is_course_teacher(a.course_id)
        )
        OR is_admin_user()
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.assignments a
            WHERE a.assignment_id = submissions.assignment_id
            AND is_course_teacher(a.course_id)
        )
        OR is_admin_user()
    );

GRANT ALL ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;

-- ============================================================================
-- PART 10: Create shared_access table (before files, but without FK constraint)
-- ============================================================================

-- Create shared_access table first (without foreign key to files yet)
CREATE TABLE IF NOT EXISTS public.shared_access (
    share_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL, -- Will add foreign key constraint after files table is created
    owner_id UUID NOT NULL REFERENCES public.secureshare_users(user_id) ON DELETE CASCADE,
    shared_with_id UUID REFERENCES public.secureshare_users(user_id) ON DELETE CASCADE,
    shared_with_email VARCHAR(255) NOT NULL,
    permission VARCHAR(20) DEFAULT 'view',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_permission CHECK (permission IN ('view', 'edit', 'download'))
);

CREATE INDEX IF NOT EXISTS idx_shared_access_file_id ON public.shared_access(file_id);
CREATE INDEX IF NOT EXISTS idx_shared_access_owner_id ON public.shared_access(owner_id);
CREATE INDEX IF NOT EXISTS idx_shared_access_shared_with_id ON public.shared_access(shared_with_id);
CREATE INDEX IF NOT EXISTS idx_shared_access_shared_with_email ON public.shared_access(shared_with_email);

-- ============================================================================
-- PART 11: Create files table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.files (
    file_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.secureshare_users(user_id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100),
    bucket VARCHAR(100) NOT NULL,
    folder_path TEXT DEFAULT '',
    is_folder BOOLEAN DEFAULT FALSE,
    is_trashed BOOLEAN DEFAULT FALSE,
    is_shared BOOLEAN DEFAULT FALSE,
    trashed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Now add the foreign key constraint from shared_access to files
ALTER TABLE public.shared_access 
    ADD CONSTRAINT fk_shared_access_file_id 
    FOREIGN KEY (file_id) 
    REFERENCES public.files(file_id) 
    ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_files_user_id ON public.files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_folder_path ON public.files(folder_path);
CREATE INDEX IF NOT EXISTS idx_files_is_trashed ON public.files(is_trashed);
CREATE INDEX IF NOT EXISTS idx_files_is_folder ON public.files(is_folder);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_files_updated_at ON public.files;
CREATE TRIGGER trigger_update_files_updated_at
    BEFORE UPDATE ON public.files
    FOR EACH ROW
    EXECUTE FUNCTION public.update_files_updated_at();

ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for files (now shared_access table exists)
DROP POLICY IF EXISTS "Users can view their own files" ON public.files;
DROP POLICY IF EXISTS "Users can insert their own files" ON public.files;
DROP POLICY IF EXISTS "Users can update their own files" ON public.files;
DROP POLICY IF EXISTS "Users can delete their own files" ON public.files;
DROP POLICY IF EXISTS "Users can view shared files" ON public.files;

CREATE POLICY "Users can view their own files"
    ON public.files FOR SELECT
    USING (user_id = auth.uid() OR is_admin_user());

CREATE POLICY "Users can insert their own files"
    ON public.files FOR INSERT
    WITH CHECK (user_id = auth.uid() OR is_admin_user());

CREATE POLICY "Users can update their own files"
    ON public.files FOR UPDATE
    USING (user_id = auth.uid() OR is_admin_user())
    WITH CHECK (user_id = auth.uid() OR is_admin_user());

CREATE POLICY "Users can delete their own files"
    ON public.files FOR DELETE
    USING (user_id = auth.uid() OR is_admin_user());

CREATE POLICY "Users can view shared files"
    ON public.files FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.shared_access
            WHERE shared_access.file_id = files.file_id
            AND (
                shared_access.shared_with_id = auth.uid()
                OR shared_access.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
            )
        )
        OR is_admin_user()
    );

GRANT ALL ON public.files TO authenticated;
GRANT ALL ON public.files TO service_role;

-- ============================================================================
-- PART 12: RLS Policies for shared_access (now both tables exist)
-- ============================================================================

ALTER TABLE public.shared_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shared_access
DROP POLICY IF EXISTS "Owners can view their shares" ON public.shared_access;
DROP POLICY IF EXISTS "Owners can insert their shares" ON public.shared_access;
DROP POLICY IF EXISTS "Owners can update their shares" ON public.shared_access;
DROP POLICY IF EXISTS "Owners can delete their shares" ON public.shared_access;
DROP POLICY IF EXISTS "Users can view shares with them" ON public.shared_access;

CREATE POLICY "Owners can view their shares"
    ON public.shared_access FOR SELECT
    USING (owner_id = auth.uid() OR is_admin_user());

CREATE POLICY "Owners can insert their shares"
    ON public.shared_access FOR INSERT
    WITH CHECK (owner_id = auth.uid() OR is_admin_user());

CREATE POLICY "Owners can update their shares"
    ON public.shared_access FOR UPDATE
    USING (owner_id = auth.uid() OR is_admin_user())
    WITH CHECK (owner_id = auth.uid() OR is_admin_user());

CREATE POLICY "Owners can delete their shares"
    ON public.shared_access FOR DELETE
    USING (owner_id = auth.uid() OR is_admin_user());

CREATE POLICY "Users can view shares with them"
    ON public.shared_access FOR SELECT
    USING (
        shared_with_id = auth.uid()
        OR shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        OR is_admin_user()
    );

GRANT ALL ON public.shared_access TO authenticated;
GRANT ALL ON public.shared_access TO service_role;

-- ============================================================================
-- PART 13: Create activity_log table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.activity_log (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.secureshare_users(user_id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255),
    file_id UUID REFERENCES public.files(file_id) ON DELETE SET NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_action_type ON public.activity_log(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_log_file_id ON public.activity_log(file_id);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activity_log
DROP POLICY IF EXISTS "Users can view their own activity" ON public.activity_log;
DROP POLICY IF EXISTS "Users can insert their own activity" ON public.activity_log;

CREATE POLICY "Users can view their own activity"
    ON public.activity_log FOR SELECT
    USING (user_id = auth.uid() OR is_admin_user());

CREATE POLICY "Users can insert their own activity"
    ON public.activity_log FOR INSERT
    WITH CHECK (user_id = auth.uid() OR is_admin_user());

GRANT ALL ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;

-- ============================================================================
-- PART 14: Create helper functions (for bypassing RLS on file operations)
-- ============================================================================

-- Function to insert file (bypasses RLS)
CREATE OR REPLACE FUNCTION public.insert_file(
    p_user_id UUID,
    p_file_name VARCHAR,
    p_file_path TEXT,
    p_file_size BIGINT,
    p_file_type VARCHAR,
    p_folder_path TEXT,
    p_bucket VARCHAR,
    p_is_folder BOOLEAN,
    p_is_trashed BOOLEAN,
    p_is_shared BOOLEAN
)
RETURNS TABLE (
    file_id UUID,
    user_id UUID,
    file_name VARCHAR,
    file_path TEXT,
    file_size BIGINT,
    file_type VARCHAR,
    bucket VARCHAR,
    folder_path TEXT,
    is_folder BOOLEAN,
    is_trashed BOOLEAN,
    is_shared BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    INSERT INTO public.files (
        user_id, file_name, file_path, file_size, file_type,
        folder_path, bucket, is_folder, is_trashed, is_shared
    )
    VALUES (
        p_user_id, p_file_name, p_file_path, p_file_size, p_file_type,
        p_folder_path, p_bucket, p_is_folder, p_is_trashed, p_is_shared
    )
    RETURNING 
        files.file_id, files.user_id, files.file_name, files.file_path,
        files.file_size, files.file_type, files.bucket, files.folder_path,
        files.is_folder, files.is_trashed, files.is_shared,
        files.created_at, files.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create folder (bypasses RLS)
CREATE OR REPLACE FUNCTION public.create_folder(
    p_user_id UUID,
    p_folder_name VARCHAR,
    p_parent_folder_path TEXT,
    p_bucket VARCHAR
)
RETURNS TABLE (
    file_id UUID,
    user_id UUID,
    file_name VARCHAR,
    file_path TEXT,
    file_size BIGINT,
    file_type VARCHAR,
    bucket VARCHAR,
    folder_path TEXT,
    is_folder BOOLEAN,
    is_trashed BOOLEAN,
    is_shared BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_folder_path TEXT;
    v_file_path TEXT;
BEGIN
    -- Generate folder path
    IF p_parent_folder_path IS NULL OR p_parent_folder_path = '' THEN
        v_folder_path := '';
        v_file_path := p_user_id::TEXT || '/' || p_folder_name;
    ELSE
        v_folder_path := p_parent_folder_path;
        v_file_path := p_parent_folder_path || '/' || p_folder_name;
    END IF;

    RETURN QUERY
    INSERT INTO public.files (
        user_id,
        file_name,
        file_path,
        file_size,
        file_type,
        folder_path,
        bucket,
        is_folder,
        is_trashed,
        is_shared
    )
    VALUES (
        p_user_id,
        p_folder_name,
        v_file_path,
        0, -- Folders have 0 size
        'folder',
        v_folder_path,
        p_bucket,
        TRUE, -- is_folder
        FALSE, -- is_trashed
        FALSE -- is_shared
    )
    RETURNING 
        files.file_id, files.user_id, files.file_name, files.file_path,
        files.file_size, files.file_type, files.bucket, files.folder_path,
        files.is_folder, files.is_trashed, files.is_shared,
        files.created_at, files.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================

