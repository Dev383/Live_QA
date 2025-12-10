'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

const Navbar: React.FC = () => {
    const { user, logout } = useAuth();

    return (
        <nav className="bg-blue-900 text-white shadow-lg border-b border-yellow-500/20">
            <div className="container mx-auto px-4 py-3">
                <div className="flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative w-10 h-10 bg-white rounded-full p-1 flex items-center justify-center overflow-hidden border-2 border-yellow-400">
                            <Image
                                src="/image.png"
                                alt="Hemut Logo"
                                width={40}
                                height={40}
                                className="object-contain"
                            />
                        </div>
                        <span className="text-2xl font-bold text-yellow-400 tracking-tight group-hover:text-yellow-300 transition">
                            Hemut Q&A
                        </span>
                    </Link>

                    <div className="flex gap-4 items-center">
                        {user ? (
                            <>
                                <span className="text-sm text-blue-100 hidden sm:inline">
                                    Welcome, <span className="font-semibold text-white">{user.username}</span> {user.is_admin && <span className="text-yellow-400">(Admin)</span>}
                                </span>
                                {user.is_admin && (
                                    <Link
                                        href="/admin/grouped-questions"
                                        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition shadow-sm"
                                    >
                                        Smart Grouping
                                    </Link>
                                )}
                                <button
                                    onClick={logout}
                                    className="bg-red-500/90 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="text-white hover:text-yellow-400 font-medium px-3 py-2 transition"
                                >
                                    Login
                                </Link>

                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;