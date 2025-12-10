"use client";

import { useState } from "react";
import api from "@/lib/api";

interface AISuggestionProps {
    questionText: string;
    onSuggestionSelect: (suggestion: string) => void;
}

export default function AISuggestion({ questionText, onSuggestionSelect }: AISuggestionProps) {
    const [loading, setLoading] = useState(false);
    const [suggestion, setSuggestion] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGetSuggestion = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await api.getAISuggestion(questionText);
            setSuggestion(result);
        } catch (err) {
            setError("Failed to get suggestion. Ensure you are an admin.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-2 mb-4">
            {!suggestion ? (
                <button
                    onClick={handleGetSuggestion}
                    disabled={loading}
                    className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200 flex items-center gap-2 transition-colors"
                >
                    {loading ? (
                        <>
                            <span className="animate-spin">✨</span> Thinking...
                        </>
                    ) : (
                        <>
                            <span>✨</span> Ask AI
                        </>
                    )}
                </button>
            ) : (
                <div className="bg-purple-50 border border-purple-100 p-3 rounded-lg text-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-purple-800 flex items-center gap-1">
                            <span>✨</span> AI Suggestion
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSuggestion(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                Dismiss
                            </button>
                            <button
                                onClick={() => onSuggestionSelect(suggestion)}
                                className="text-purple-600 font-medium hover:text-purple-800 border-l border-purple-200 pl-2"
                            >
                                Use this
                            </button>
                        </div>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{suggestion}</p>
                </div>
            )}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}
