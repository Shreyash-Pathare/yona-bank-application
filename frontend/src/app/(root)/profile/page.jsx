"use client";
import HeaderName from '@/components/HeaderName';
import { useMainContext } from '@/context/MainContext';
import React from 'react';
import { FaUser, FaEnvelope, FaCreditCard, FaMoneyBillWave } from 'react-icons/fa';
import { BsBank2 } from 'react-icons/bs';
import { GiReceiveMoney } from 'react-icons/gi';

const ProfilePage = () => {
  const { user } = useMainContext();

  if (!user) return null;

  const stats = [
    {
      title: "Total Balance",
      value: `₹${user.account_no?.map((cur) => cur.amount).reduce((pre, cur) => pre + cur, 0) ?? 0}`,
      Icon: FaMoneyBillWave,
      bg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      border: "border-emerald-200",
    },
    {
      title: "Total Accounts",
      value: user.account_no?.length ?? 0,
      Icon: BsBank2,
      bg: "bg-blue-50",
      iconColor: "text-blue-600",
      border: "border-blue-200",
    },
    {
      title: "FD Amount",
      value: `₹${user.fd_amount ?? 0}`,
      Icon: GiReceiveMoney,
      bg: "bg-amber-50",
      iconColor: "text-amber-600",
      border: "border-amber-200",
    },
    {
      title: "ATM Cards",
      value: user.atms?.length ?? 0,
      Icon: FaCreditCard,
      bg: "bg-rose-50",
      iconColor: "text-rose-600",
      border: "border-rose-200",
    },
  ];

  return (
    <div className="container py-10 px-4">
      <HeaderName />

      {/* Profile Card */}
      <div className="mt-8 max-w-3xl mx-auto">
        
        {/* Avatar & Name Section */}
        <div className="bg-gradient-to-r from-rose-600 to-rose-400 rounded-2xl p-8 flex flex-col items-center justify-center text-white shadow-lg">
          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-md mb-4">
            <FaUser className="text-5xl text-rose-600" />
          </div>
          <h2 className="text-3xl font-bold capitalize">{user.name}</h2>
          <div className="flex items-center gap-x-2 mt-2 text-rose-100">
            <FaEnvelope className="text-lg" />
            <p className="text-lg">{user.email}</p>
          </div>
          <span className="mt-4 px-4 py-1 bg-white text-rose-600 rounded-full text-sm font-semibold">
            Premium Member
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`${stat.bg} ${stat.border} border rounded-xl p-4 flex flex-col items-center justify-center gap-y-2 shadow-sm`}
            >
              <stat.Icon className={`text-3xl ${stat.iconColor}`} />
              <p className="text-sm text-zinc-500 font-medium text-center">{stat.title}</p>
              <p className="text-xl font-bold text-zinc-800">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-6 border rounded-xl p-6 bg-white shadow-sm flex flex-col gap-y-4">
          <h3 className="text-lg font-bold text-zinc-800 border-b pb-2">Account Details</h3>

          <div className="flex items-center justify-between py-2 border-b">
            <p className="text-zinc-500 font-medium">Full Name</p>
            <p className="font-bold capitalize text-zinc-800">{user.name}</p>
          </div>

          <div className="flex items-center justify-between py-2 border-b">
            <p className="text-zinc-500 font-medium">Email Address</p>
            <p className="font-bold text-zinc-800">{user.email}</p>
          </div>

          <div className="flex items-center justify-between py-2 border-b">
            <p className="text-zinc-500 font-medium">Member Since</p>
            <p className="font-bold text-zinc-800">
              {new Date(user.createdAt).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          <div className="flex items-center justify-between py-2">
            <p className="text-zinc-500 font-medium">Account Status</p>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-sm font-semibold">
              Active
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;
