import React, { useEffect, useState } from 'react';
import CountdownTimer from './CountdownTimer';
import PaymentButton from './PaymentButton';

const EscrowDashboard = () => {
    const [escrows, setEscrows] = useState([]);
    const [user, setUser] = useState('client'); // 'client' or 'freelancer'

    useEffect(() => {
        fetch('http://localhost:5001/escrow/get-escrows')
            .then((res) => res.json())
            .then((data) => setEscrows(data));
    }, []);

    const handleReleaseFunds = async (paymentIntentId) => {
        const response = await fetch('http://localhost:5001/escrow/release-funds', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentIntentId }),
        });
        const result = await response.json();
        alert(result.message);
    };

    return (
        <div className="dashboard-container">
            <h2>Escrow Dashboard</h2>
            <p>Current User: <strong>{user}</strong></p>
            <button onClick={() => setUser(user === 'client' ? 'freelancer' : 'client')}>
                Switch to {user === 'client' ? 'Freelancer' : 'Client'}
            </button>
            <div className="escrow-list">
                {escrows.map((escrow) => (
                    <div key={escrow.id} className="escrow-item">
                        <p><strong>Amount:</strong> ${escrow.amount}</p>
                        <p><strong>Status:</strong> {escrow.status}</p>
                        <CountdownTimer endTime={escrow.autoReleaseTime} />
                        {user === 'client' && (
                            <PaymentButton label="Release Funds" onClick={() => handleReleaseFunds(escrow.paymentIntentId)} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EscrowDashboard;
