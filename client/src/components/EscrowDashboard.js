import React, { useEffect, useState } from 'react';
import CountdownTimer from './CountdownTimer';
import PaymentButton from './PaymentButton';
import UserSwitcher from './UserSwitcher';

const EscrowDashboard = () => {
    const [escrows, setEscrows] = useState([]);
    const [user, setUser] = useState('client'); // Toggle user type

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

    const handlePartialRelease = async (paymentIntentId, amount) => {
        const response = await fetch('http://localhost:5001/escrow/partial-release', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentIntentId, amount }),
        });
        const result = await response.json();
        alert(result.message);
    };

    const handleRescindFunds = async (paymentIntentId) => {
        const response = await fetch('http://localhost:5001/escrow/rescind-funds', {
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
            <UserSwitcher user={user} setUser={setUser} />
            <div className="escrow-list">
                {escrows.map((escrow) => (
                    <div key={escrow.id} className="escrow-item">
                        <p><strong>Amount:</strong> ${escrow.amount}</p>
                        <p><strong>Status:</strong> {escrow.status}</p>
                        <CountdownTimer endTime={escrow.autoReleaseTime} />
                        
                        {user === 'client' && (
                            <>
                                <PaymentButton label="Release Funds" onClick={() => handleReleaseFunds(escrow.paymentIntentId)} />
                                <PaymentButton label="Partial Release" onClick={() => handlePartialRelease(escrow.paymentIntentId, escrow.amount / 2)} />
                                <PaymentButton label="Rescind Funds" onClick={() => handleRescindFunds(escrow.paymentIntentId)} />
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EscrowDashboard;
