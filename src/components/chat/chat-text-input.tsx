"use client";

import { KeyboardEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface ChatTextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isDisabled?: boolean;
  placeholder?: string;
}

export function ChatTextInput({
  value,
  onChange,
  onSubmit,
  isDisabled = false,
  placeholder = "Type your message... (Shift+Enter for new line)"
}: ChatTextInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="min-h-[60px] max-h-[200px]"
        disabled={isDisabled}
      />
      <Button
        onClick={onSubmit}
        disabled={!value.trim() || isDisabled}
        className="flex-shrink-0"
      >
        <Send className="w-5 h-5" />
      </Button>
    </>
  );
}