"use client";
import { useMainContext } from '@/context/MainContext';
import { axiosClient } from '@/utils/AxiosClient';
import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useState } from 'react'
import { CiSquarePlus } from "react-icons/ci";
import { IoClose } from "react-icons/io5";
import { RiMoneyRupeeCircleLine } from "react-icons/ri";
import { toast } from 'react-toastify';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// ✅ Inner payment form using Stripe hooks
const CheckoutForm = ({ txn_id, onSuccess, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    try {
      setLoading(true);

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Verify payment on backend
        await axiosClient.post(`/amount/payment/${txn_id}`, {}, {
          headers: {
            Authorization: 'Bearer ' + localStorage.getItem('token')
          }
        });

        toast.success("Payment Successful!");
        onSuccess();
        onClose();
      }

    } catch (error) {
      toast.error(error.response?.data?.msg || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-[96%] lg:w-[80%] mx-auto">
      <PaymentElement className="mb-4" />
      <button
        disabled={!stripe || loading}
        className="px-5 flex items-center gap-x-2 w-full bg-rose-600 hover:bg-rose-700 text-white py-2 disabled:bg-rose-400 justify-center rounded mt-4"
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
};

// ✅ Main Modal
export default function AddAmountModel({ id }) {
  const { fetchUserProfile } = useMainContext();
  let [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [txnId, setTxnId] = useState(null);
  const [amount, setAmount] = useState('');

  function closeModal() {
    setIsOpen(false);
    setClientSecret(null);
    setAmount('');
  }

  function openModal() {
    setIsOpen(true);
  }

  const handleCreatePayment = async () => {
    if (!amount || parseInt(amount) < 1) {
      toast.error("Enter a valid amount");
      return;
    }

    try {
      setLoading(true);
      const response = await axiosClient.post('/amount/add-money', {
        amount: parseInt(amount),
        account_no: id
      }, {
        headers: {
          Authorization: 'Bearer ' + localStorage.getItem('token')
        }
      });

      setClientSecret(response.data.client_secret);
      setTxnId(response.data.txn_id);

    } catch (error) {
      toast.error(error.response?.data?.msg || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button type="button" onClick={openModal} className='text-3xl text-rose-700 cursor-pointer'>
        <CiSquarePlus />
      </button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-[50vh] items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center justify-between">
                    <span>Add Payment</span>
                    <button onClick={closeModal} className='text-2xl text-black p-2 bg-rose-100 rounded-full cursor-pointer'>
                      <IoClose />
                    </button>
                  </Dialog.Title>

                  <div className="w-full py-3 flex justify-center items-center">
                    <img src="/logo.svg" alt="" className='w-1/2 mx-auto' />
                  </div>

                  {/* Step 1 - Enter Amount */}
                  {!clientSecret && (
                    <div className="w-[96%] lg:w-[80%] mx-auto">
                      <div className="mb-3 flex items-center gap-x-2 border w-full px-2">
                        <RiMoneyRupeeCircleLine className='text-2xl' />
                        <input
                          type="text"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                          className='w-full py-2 outline-none border-none rounded'
                          placeholder='Enter Amount (in INR)'
                        />
                      </div>
                      <button
                        disabled={!amount || parseInt(amount) < 1 || loading}
                        onClick={handleCreatePayment}
                        className="px-5 flex items-center gap-x-2 w-full bg-rose-600 hover:bg-rose-700 text-white py-2 disabled:bg-rose-400 justify-center rounded"
                      >
                        {loading ? 'Please wait...' : 'Proceed to Pay'}
                      </button>
                    </div>
                  )}

                  {/* Step 2 - Stripe Payment Element */}
                  {clientSecret && (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <CheckoutForm
                        txn_id={txnId}
                        onSuccess={fetchUserProfile}
                        onClose={closeModal}
                      />
                    </Elements>
                  )}

                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
