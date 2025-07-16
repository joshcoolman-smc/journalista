import { useEffect, useRef, useState } from 'react';
import { JournalFile, AutoSaveStatus } from '../types/journal';

const AUTOSAVE_DELAY = 1000; // 1 second

export const useAutoSave = (
  currentFile: JournalFile | null,
  saveFile: (file: JournalFile) => Promise<void>
) => {
  const [status, setStatus] = useState<AutoSaveStatus>('saved');
  const [lastSaved, setLastSaved] = useState<Date | undefined>();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const previousContentRef = useRef<string>('');

  useEffect(() => {
    if (currentFile) {
      previousContentRef.current = currentFile.content;
    }
  }, [currentFile?.id]);

  const triggerAutoSave = async (file: JournalFile) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Don't save if content hasn't changed
    if (file.content === previousContentRef.current) {
      return;
    }

    setStatus('saving');

    timeoutRef.current = setTimeout(async () => {
      try {
        await saveFile(file);
        setStatus('saved');
        setLastSaved(new Date());
        previousContentRef.current = file.content;
      } catch (error) {
        console.error('Auto-save failed:', error);
        setStatus('error');
      }
    }, AUTOSAVE_DELAY);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    status,
    lastSaved,
    triggerAutoSave
  };
};
