-- Fix the notification trigger that fires on attendance insert
-- The original trigger was trying to access sc.name from student_classes table
-- but that column doesn't exist - the class name is in the classes table

DROP TRIGGER IF EXISTS attendance_notification_trigger ON attendance;

DROP FUNCTION IF EXISTS notify_attendance_marked();

CREATE OR REPLACE FUNCTION notify_attendance_marked()
RETURNS TRIGGER AS $$
DECLARE
  v_student_id UUID;
  v_student_name TEXT;
  v_class_id UUID;
  v_class_name TEXT;
  v_school_id UUID;
  v_parent_id UUID;
BEGIN
  -- Only trigger for absent records
  IF NEW.status = 'absent' THEN
    -- Get student and class info
    SELECT u.id, u.full_name, c.id, c.name, NEW.school_id
    INTO v_student_id, v_student_name, v_class_id, v_class_name, v_school_id
    FROM users u
    LEFT JOIN classes c ON c.id = NEW.class_id
    WHERE u.id = NEW.student_id;

    -- Only send notification if we found the student
    IF v_student_id IS NOT NULL THEN
      -- Send notification to each parent linked to student
      FOR v_parent_id IN 
        SELECT parent_id FROM parent_student_links 
        WHERE student_id = v_student_id AND school_id = v_school_id
      LOOP
        -- Insert notification record
        INSERT INTO notifications (school_id, user_id, title, message, type, link, read)
        VALUES (
          v_school_id,
          v_parent_id,
          '📋 Attendance Alert',
          v_student_name || ' was marked absent on ' || NEW.date::TEXT || COALESCE(' in ' || v_class_name, ''),
          'warning',
          '/parent/attendance',
          false
        );
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER attendance_notification_trigger
AFTER INSERT OR UPDATE ON attendance
FOR EACH ROW
EXECUTE FUNCTION notify_attendance_marked();
