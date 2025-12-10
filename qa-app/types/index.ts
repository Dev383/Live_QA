export interface User {
    user_id: string;
    username: string;
    email: string;
    is_admin: boolean;
}

export interface Question {
    question_id: string;
    user_id: string;
    username?: string;
    message: string;
    status: "Pending" | "Escalated" | "Answered";
    timestamp: string;
    answers?: Answer[];
}

export interface Answer {
    answer_id: string;
    question_id: string;
    user_id: string;
    username?: string;
    message: string;
    timestamp: string;
}

export interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;

    logout: () => void;
    isLoading: boolean;
}
