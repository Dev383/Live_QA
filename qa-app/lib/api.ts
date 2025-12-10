import axios from "axios";
import { Question, User } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Adding tokens
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authAPI = {
    login: async (email: string, password: string) => {
        const response = await api.post("/auth/login", { email, password });
        return response.data;
    },



    getCurrentUser: async () => {
        const response = await api.get("/auth/me");
        return response.data;
    },
};

export const questionsAPI = {
    getQuestions: async (): Promise<Question[]> => {
        const response = await api.get("/questions");
        return response.data;
    },

    submitQuestion: async (message: string): Promise<Question> => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", `${API_URL}/questions`, true);
            xhr.setRequestHeader("Content-Type", "application/json");

            const token = localStorage.getItem("token");
            if (token) {
                xhr.setRequestHeader("Authorization", `Bearer ${token}`);
            }

            xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    reject(new Error(xhr.statusText));
                }
            };

            xhr.onerror = function () {
                reject(new Error("Network error"));
            };

            // Validation
            if (!message || message.trim() === "") {
                reject(new Error("Question cannot be blank"));
                return;
            }

            xhr.send(JSON.stringify({ message: message.trim() }));
        });
    },

    markAsAnswered: async (questionId: string) => {
        const response = await api.patch(`/questions/${questionId}/answered`);
        return response.data;
    },

    escalateQuestion: async (questionId: string) => {
        const response = await api.patch(`/questions/${questionId}/escalate`);
        return response.data;
    },

    submitAnswer: async (questionId: string, message: string) => {
        const response = await api.post(`/questions/${questionId}/answers`, {
            message,
        });
        return response.data;
    },
};

export default api;

export const fetchGroupedQuestions = async () => {
    try {
        const response = await api.get('/admin/grouped-questions');
        return response.data;
    } catch (error) {
        console.error('Error fetching grouped questions:', error);
        throw error;
    }
};

export const bulkAnswerQuestions = async (questionIds: string[], answer: string) => {
    try {
        const response = await api.post('/admin/bulk-answer', {
            question_ids: questionIds,
            answer,
        });
        return response.data;
    } catch (error) {
        console.error('Error in bulk answer:', error);
        throw error;
    }
};
