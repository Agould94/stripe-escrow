import React, { useEffect, useState } from 'react';
import CountdownTimer from './CountdownTimer';
import PaymentButton from './PaymentButton';
import UserSwitcher from './UserSwitcher';

const EscrowDashboard = () => {
    const [escrows, setEscrows] = useState([]);
    const [user, setUser] = useState('client'); // Toggle user type
    const [loading, setLoading] = useState(true);

    const [amount, setAmount] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [freelancerEmail, setFreelancerEmail] = useState('');

    useEffect(() => {
        fetch('http://localhost:5001/escrow/get-escrows')
            .then((res) => res.json())
            .then((data) => {
                setEscrows(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching escrows:", error);
                setLoading(false);
            });
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

    const handleCreateEscrow = async () => {
        if (!amount || !clientEmail || !freelancerEmail) {
            alert("Please fill in all fields before creating an escrow.");
            return;
        }

        const response = await fetch('http://localhost:5001/escrow/create-escrow-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, clientEmail, freelancerEmail }),
        });

        const result = await response.json();
        if (result.error) {
            alert(`Error: ${result.error}`);
        } else {
            alert(`Escrow session created! Payment Intent ID: ${result.paymentIntentId}`);
            setEscrows([...escrows, { 
                id: result.paymentIntentId, 
                amount, 
                clientEmail, 
                freelancerEmail, 
                status: "Pending", 
                autoReleaseTime: Date.now() + 7 * 24 * 60 * 60 * 1000 
            }]);
        }
    };

    return (
        <div className="dashboard-container">
            <h2>Escrow Dashboard</h2>
            <UserSwitcher user={user} setUser={setUser} />

            {/* Escrow Creation Form */}
            {user === 'client' && (
                <div className="escrow-form">
                    <h3>Initiate a New Escrow</h3>
                    <input 
                        type="number" 
                        placeholder="Amount (USD)" 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)} 
                    />
                    <input 
                        type="email" 
                        placeholder="Client Email" 
                        value={clientEmail} 
                        onChange={(e) => setClientEmail(e.target.value)} 
                    />
                    <input 
                        type="email" 
                        placeholder="Freelancer Email" 
                        value={freelancerEmail} 
                        onChange={(e) => setFreelancerEmail(e.target.value)} 
                    />
                    <button onClick={handleCreateEscrow}>Create Escrow</button>
                </div>
            )}

            {loading ? (
                <p>Loading escrows...</p>
            ) : escrows.length === 0 ? (
                <p>No escrows found.</p>
            ) : (
                <div className="escrow-list">
                    {escrows.map((escrow) => (
                        <div key={escrow.id} className="escrow-item">
                            <p><strong>Amount:</strong> ${escrow.amount}</p>
                            <p><strong>Client:</strong> {escrow.clientEmail}</p>
                            <p><strong>Freelancer:</strong> {escrow.freelancerEmail}</p>
                            <p><strong>Status:</strong> {escrow.status}</p>
                            <CountdownTimer endTime={escrow.autoReleaseTime} />

                            {user === 'client' && (
                                <>
                                    <PaymentButton label="Release Funds" onClick={() => handleReleaseFunds(escrow.id)} />
                                    <PaymentButton label="Partial Release" onClick={() => handlePartialRelease(escrow.id, escrow.amount / 2)} />
                                    <PaymentButton label="Rescind Funds" onClick={() => handleRescindFunds(escrow.id)} />
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EscrowDashboard;
