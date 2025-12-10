'use client';

import React, { useState } from 'react';
import { Question } from '@/types';
import { questionsAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface QuestionItemProps {
    question: Question;
    onUpdate: () => void;
}

const QuestionItem: React.FC<QuestionItemProps> = ({ question, onUpdate }) => {
    const { user } = useAuth();
    const [showAnswerForm, setShowAnswerForm] = useState(false);
    const [answerText, setAnswerText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleMarkAnswered = async () => {
        try {
            await questionsAPI.markAsAnswered(question.question_id);
            onUpdate();
        } catch (err) {
            console.error('Failed to mark as answered:', err);
        }
    };

    const handleEscalate = async () => {
        try {
            await questionsAPI.escalateQuestion(question.question_id);
            onUpdate();
        } catch (err) {
            console.error('Failed to escalate:', err);
        }
    };

    const handleSubmitAnswer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!answerText.trim()) return;

        setIsSubmitting(true);
        try {
            await questionsAPI.submitAnswer(question.question_id, answerText);
            setAnswerText('');
            setShowAnswerForm(false);
            onUpdate();
        } catch (err) {
            console.error('Failed to submit answer:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusColor = () => {
        switch (question.status) {
            case 'Answered':
                return 'bg-green-100 text-green-800';
            case 'Escalated':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-yellow-100 text-yellow-800';
        }
    };

    return (
        <div className={`bg-white rounded-lg shadow-md p-6 mb-4 ${question.status === 'Escalated' ? 'border-2 border-red-500' : ''}`}>
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor()}`}>
                            {question.status}
                        </span>
                        <span className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(question.timestamp), { addSuffix: true })}
                        </span>
                        {question.username && (
                            <span className="text-sm text-gray-600">
                                by {question.username}
                            </span>
                        )}
                    </div>
                    <p className="text-lg text-gray-800">{question.message}</p>
                </div>
            </div>

            {/* Answers */}
            {question.answers && question.answers.length > 0 && (
                <div className="mt-4 pl-4 border-l-2 border-gray-200">
                    <h4 className="font-semibold text-gray-700 mb-2">Answers:</h4>
                    {question.answers.map((answer) => (
                        <div key={answer.answer_id} className="bg-gray-50 rounded p-3 mb-2">
                            <p className="text-gray-800">{answer.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                {answer.username} • {formatDistanceToNow(new Date(answer.timestamp), { addSuffix: true })}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex gap-2 flex-wrap">
                {question.status !== 'Answered' && (
                    <button
                        onClick={() => setShowAnswerForm(!showAnswerForm)}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition text-sm"
                    >
                        {showAnswerForm ? 'Cancel' : 'Answer'}
                    </button>
                )}

                {user?.is_admin && question.status !== 'Answered' && (
                    <button
                        onClick={handleMarkAnswered}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition text-sm"
                    >
                        Mark Answered
                    </button>
                )}

                {user?.is_admin && question.status === 'Pending' && (
                    <button
                        onClick={handleEscalate}
                        className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition text-sm"
                    >
                        Escalate
                    </button>
                )}
            </div>

            {/* Answer Form */}
            {showAnswerForm && (
                <form onSubmit={handleSubmitAnswer} className="mt-4">
                    <textarea
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder="Type your answer..."
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                    />
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 transition text-sm"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default QuestionItem;