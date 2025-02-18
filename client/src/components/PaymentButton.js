import React from 'react';

const PaymentButton = ({ label, onClick, disabled = false }) => {
    return (
        <button className="payment-button" onClick={onClick} disabled={disabled}>
            {label}
        </button>
    );
};

export default PaymentButton;
