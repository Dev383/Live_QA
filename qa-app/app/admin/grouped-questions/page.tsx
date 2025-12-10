'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchGroupedQuestions, bulkAnswerQuestions } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Question {
    question_id: string;
    message: string;
    status: string;
    timestamp: string;
    username?: string;
}

interface GroupedQuestion {
    title: string;
    count: number;
    questions: Question[];
}

export default function GroupedQuestionsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [groups, setGroups] = useState<GroupedQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState<{ [key: string]: string }>({});
    const [submitting, setSubmitting] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        if (!authLoading && (!user || !user.is_admin)) {
            router.push('/');
            return;
        }

        if (user?.is_admin) {
            loadGroups();
        }
    }, [user, authLoading, router]);

    const loadGroups = async () => {
        try {
            const data = await fetchGroupedQuestions();
            setGroups(data);
        } catch (error) {
            console.error('Failed to load grouped questions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (groupIndex: number, value: string) => {
        setAnswers(prev => ({ ...prev, [groupIndex]: value }));
    };

    const handleBulkAnswer = async (groupIndex: number, group: GroupedQuestion) => {
        const answer = answers[groupIndex];
        if (!answer?.trim()) return;

        setSubmitting(prev => ({ ...prev, [groupIndex]: true }));
        try {
            const questionIds = group.questions.map(q => q.question_id);
            await bulkAnswerQuestions(questionIds, answer);

            // Remove the group or update UI
            setGroups(prev => prev.filter((_, idx) => idx !== groupIndex));
            setAnswers(prev => {
                const next = { ...prev };
                delete next[groupIndex];
                return next;
            });

            alert('Answers submitted successfully!');
        } catch (error) {
            console.error('Failed to submit bulk answer:', error);
            alert('Failed to submit answer.');
        } finally {
            setSubmitting(prev => ({ ...prev, [groupIndex]: false }));
        }
    };

    if (authLoading || loading) {
        return <div className="p-8 text-center text-gray-400">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-gray-200 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent mb-8">
                    Smart Question Grouping
                </h1>

                <div className="space-y-6">
                    {groups.length === 0 ? (
                        <div className="text-center p-12 border border-gray-800 rounded-lg bg-gray-900/50">
                            <p className="text-gray-400">No pending questions found to group.</p>
                        </div>
                    ) : (
                        groups.map((group, index) => (
                            <div key={index} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-semibold text-white mb-1">
                                            Topic: "{group.title}"
                                        </h3>
                                        <span className="text-sm text-teal-400 font-medium">
                                            {group.count} Similar Questions
                                        </span>
                                    </div>
                                </div>

                                <div className="mb-6 space-y-2 max-h-48 overflow-y-auto custom-scrollbar bg-black/20 p-4 rounded-lg">
                                    {group.questions.map((q) => (
                                        <div key={q.question_id} className="text-sm text-gray-400 border-b border-gray-800 last:border-0 pb-2 last:pb-0">
                                            <p>"{q.message}"</p>
                                            <span className="text-xs text-gray-600">
                                                {new Date(q.timestamp).toLocaleDateString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-3">
                                    <textarea
                                        placeholder="Type a common answer for all these questions..."
                                        value={answers[index] || ''}
                                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                                        className="w-full bg-black/40 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all min-h-[100px]"
                                    />
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => handleBulkAnswer(index, group)}
                                            disabled={submitting[index] || !answers[index]?.trim()}
                                            className="px-6 py-2 bg-gradient-to-r from-teal-500 to-blue-600 text-white font-medium rounded-lg hover:from-teal-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-teal-500/20"
                                        >
                                            {submitting[index] ? 'Sending...' : 'Answer All'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
