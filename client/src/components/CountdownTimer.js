import React, { useState, useEffect } from 'react';

const CountdownTimer = ({ endTime }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const timeRemaining = endTime - now;
            if (timeRemaining <= 0) {
                clearInterval(interval);
                setTimeLeft("Funds auto-released!");
            } else {
                const hours = Math.floor((timeRemaining / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((timeRemaining / (1000 * 60)) % 60);
                const seconds = Math.floor((timeRemaining / 1000) % 60);
                setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [endTime]);

    return <p><strong>Time Until Auto-Release:</strong> {timeLeft}</p>;
};

export default CountdownTimer;
