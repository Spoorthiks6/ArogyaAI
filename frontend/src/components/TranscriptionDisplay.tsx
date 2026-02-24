import { X } from "lucide-react";

interface TranscriptionDisplayProps {
  transcript: string;
  isLoading?: boolean;
  onClose?: () => void;
}

const TranscriptionDisplay = ({ transcript, isLoading, onClose }: TranscriptionDisplayProps) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl animate-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <span className="text-2xl">🎤</span> Voice Recording Transcription
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-20 bg-muted rounded-lg animate-pulse"></div>
            <p className="text-sm text-muted-foreground text-center">
              Transcribing your voice message...
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-h-48 overflow-y-auto">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {transcript || "No transcription available"}
              </p>
            </div>
            
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
              <p className="text-xs font-semibold text-green-700 dark:text-green-300">
                ✓ Transcription Complete
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                This text will be sent with your emergency alert
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TranscriptionDisplay;
