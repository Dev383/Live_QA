'use client';

import React from 'react';
import { Question } from '@/types';
import QuestionItem from './QuestionItem';

interface QuestionListProps {
    questions: Question[];
    onUpdate: () => void;
}

const QuestionList: React.FC<QuestionListProps> = ({ questions, onUpdate }) => {
    // Sort questions: Escalated first, then by timestamp
    const sortedQuestions = [...questions].sort((a, b) => {
        if (a.status === 'Escalated' && b.status !== 'Escalated') return -1;
        if (a.status !== 'Escalated' && b.status === 'Escalated') return 1;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Questions ({questions.length})</h2>
            {sortedQuestions.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
                    No questions yet. Be the first to ask!
                </div>
            ) : (
                sortedQuestions.map((question) => (
                    <QuestionItem
                        key={question.question_id}
                        question={question}
                        onUpdate={onUpdate}
                    />
                ))
            )}
        </div>
    );
};

export default QuestionList;