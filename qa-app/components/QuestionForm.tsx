'use client';

import React, { useState } from 'react';
import { questionsAPI } from '@/lib/api';

interface QuestionFormProps {
    onQuestionSubmitted: () => void;
}

const QuestionForm: React.FC<QuestionFormProps> = ({ onQuestionSubmitted }) => {
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Client-side validation
        if (!message.trim()) {
            setError('Question cannot be blank');
            return;
        }

        setIsSubmitting(true);

        try {
            await questionsAPI.submitQuestion(message);
            setMessage('');
            onQuestionSubmitted();
        } catch (err: any) {
            setError(err.message || 'Failed to submit question');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Ask a Question</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your question here..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                        disabled={isSubmitting}
                    />
                    {error && (
                        <p className="text-red-500 text-sm mt-2">{error}</p>
                    )}
                </div>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Question'}
                </button>
            </form>
        </div>
    );
};

export default QuestionForm;