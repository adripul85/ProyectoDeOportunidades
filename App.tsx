import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/marketplace/Home';
import Dashboard from './pages/Dashboard';
import Dispute from './pages/transactions/Dispute';
import Profile from './pages/Profile';
import Wallet from './pages/Wallet';
import Verification from './pages/Verification';
import Login from './pages/Login';
import Publish from './pages/publish/Publish';
import Messages from './pages/Messages';
import ProductDetail from './pages/marketplace/ProductDetail';
import Search from './pages/marketplace/Search';
import Checkout from './pages/transactions/Checkout';
import TransactionDetail from './pages/transactions/TransactionDetail';
import Success from './pages/transactions/Success';
import PaymentSuccess from './pages/transactions/PaymentSuccess';
import PaymentFailure from './pages/transactions/PaymentFailure';
import ESgrow from './pages/transactions/ESgrow';
import CompleteProfile from './pages/CompleteProfile';
import AdminDashboard from './pages/AdminDashboard';
import Settings from './pages/Settings';
import EscrowInfo from './pages/EscrowInfo';
import VerifyDelivery from './pages/VerifyDelivery';
import TermsAndCosts from './pages/legal/TermsAndCosts';
import PaymentMethods from './pages/legal/PaymentMethods';
import ResolutionCenter from './pages/ResolutionCenter';
import RequireProfile from './components/RequireProfile';
import ProtectedRoute from './components/ProtectedRoute';
import ReportedItems from './pages/admin/ReportedItems';

import Deals from './pages/Deals';
import Cart from './pages/Cart';
import Shop from './pages/marketplace/Shop';
import AppProviders from './components/AppProviders';
import Layout from './components/Layout';

function App() {
  return (
    <AppProviders>
      <Layout>
        <Routes>
          <Route path="/admin/reports" element={
            <ProtectedRoute requireAdmin={true}>
              <ReportedItems />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/deals" element={<Deals />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/shop/:uid" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/publish" element={<RequireProfile><Publish /></RequireProfile>} />
          <Route path="/transaction/:id" element={<RequireProfile><ESgrow /></RequireProfile>} />

          <Route path="/dashboard" element={<RequireProfile><Dashboard /></RequireProfile>} />
          <Route path="/messages" element={<RequireProfile><Messages /></RequireProfile>} />
          <Route path="/messages/:chatId" element={<RequireProfile><Messages /></RequireProfile>} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/profile/:uid?" element={<Profile />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />
          <Route path="/settings" element={<RequireProfile><Settings /></RequireProfile>} />
          <Route path="/login" element={<Login />} />

          <Route path="/checkout" element={<Checkout />} />
          <Route path="/success" element={<Success />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/failure" element={<PaymentFailure />} />
          <Route path="/payment/pending" element={<PaymentSuccess />} />
          <Route path="/dispute/:transactionId" element={<Dispute />} />
          <Route path="/verification" element={<Verification />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/escrow-info" element={<EscrowInfo />} />
          <Route path="/legal/costs" element={<TermsAndCosts />} />
          <Route path="/verify-delivery" element={<VerifyDelivery />} />
          <Route path="/resolution-center" element={<RequireProfile><ResolutionCenter /></RequireProfile>} />
        </Routes>
      </Layout>
    </AppProviders>
  );
}

export default App;
