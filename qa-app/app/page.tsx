'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Question } from '@/types';
import { questionsAPI } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import QuestionForm from '@/components/QuestionForm';
import QuestionList from '@/components/QuestionList';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const fetchQuestions = useCallback(async () => {
    try {
      const data = await questionsAPI.getQuestions();
      setQuestions(data);
    } catch (err) {
      console.error('Failed to fetch questions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // WebSocket setup
  useEffect(() => {
    fetchQuestions();

    const socket = getSocket();

    const handleConnect = () => {
      console.log('WebSocket connected');
    };

    const handleDisconnect = () => {
      console.log('WebSocket disconnected');
    };

    const handleNewQuestion = (question: Question) => {
      console.log('New question received:', question.question_id);
      setQuestions((prev) => {
        if (prev.some(q => q.question_id === question.question_id)) return prev;
        return [question, ...prev];
      });

      const currentUser = userRef.current;
      if (currentUser?.is_admin && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('New Question', {
          body: question.message.substring(0, 100),
        });
      }
    };

    const handleQuestionUpdated = (updatedQuestion: Question) => {
      console.log('Question updated:', updatedQuestion.question_id);
      setQuestions((prev) =>
        prev.map((q) =>
          q.question_id === updatedQuestion.question_id ? updatedQuestion : q
        )
      );
    };

    const handleNewAnswer = ({ question_id, answer }: { question_id: string; answer: any }) => {
      console.log('New answer received for question:', question_id);
      setQuestions((prev) =>
        prev.map((q) =>
          q.question_id === question_id
            ? { ...q, answers: [...(q.answers || []), answer] }
            : q
        )
      );
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('new_question', handleNewQuestion);
    socket.on('question_updated', handleQuestionUpdated);
    socket.on('new_answer', handleNewAnswer);

    if (user?.is_admin && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('new_question', handleNewQuestion);
      socket.off('question_updated', handleQuestionUpdated);
      socket.off('new_answer', handleNewAnswer);
    };
  }, [fetchQuestions]); 

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <QuestionForm onQuestionSubmitted={fetchQuestions} />
      <QuestionList questions={questions} onUpdate={fetchQuestions} />
    </div>
  );
}