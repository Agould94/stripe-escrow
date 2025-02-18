import React from 'react';

const UserSwitcher = ({ user, setUser }) => {
    return (
        <div className="user-switcher">
            <p>Current User: <strong>{user}</strong></p>
            <button onClick={() => setUser(user === 'client' ? 'freelancer' : 'client')}>
                Switch to {user === 'client' ? 'Freelancer' : 'Client'}
            </button>
        </div>
    );
};

export default UserSwitcher;
