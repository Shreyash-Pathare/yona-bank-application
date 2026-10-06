"use client";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { IoClose } from "react-icons/io5";
import { RiExchangeFundsLine, RiMoneyRupeeCircleLine } from "react-icons/ri";
import { toast } from "react-toastify";
import { axiosClient } from "@/utils/AxiosClient";

export default function FundTransferModel({ accountNumber }) {

  const [isOpen, setIsOpen] = useState(false);

  const [receiverAccount, setReceiverAccount] = useState("");

  const [amount, setAmount] = useState("");

  const [loading, setLoading] = useState(false);


  // ===============================
  // Open Modal
  // ===============================

  function openModal() {
    setIsOpen(true);
  }


  // ===============================
  // Close Modal
  // ===============================

  function closeModal() {
    setIsOpen(false);

    setReceiverAccount("");

    setAmount("");
  }


  // ===============================
  // Transfer Money
  // ===============================

  const handleTransfer = async () => {

    if (!receiverAccount) {
      toast.error("Enter receiver account number");
      return;
    }


    if (!amount || parseInt(amount) < 1) {
      toast.error("Enter a valid amount");
      return;
    }


    // Don't allow transfer to same account
    if (receiverAccount === accountNumber) {
      toast.error("You cannot transfer money to the same account");
      return;
    }


    try {

      setLoading(true);


      const response = await axiosClient.post(
        "/amount/transfer",
        {
          from_account: accountNumber,
          to_account: receiverAccount,
          amount: parseInt(amount)
        },
        {
          headers: {
            Authorization:
              "Bearer " +
              localStorage.getItem("token")
          }
        }
      );


      toast.success(
        response.data?.msg ||
        "Fund Transfer Successful"
      );


      closeModal();


    } catch (error) {

      toast.error(
        error.response?.data?.msg ||
        error.message ||
        "Transfer failed"
      );

    } finally {

      setLoading(false);

    }
  };


  return (
    <>

      {/* ================================= */}
      {/* Fund Transfer Button */}
      {/* ================================= */}

      <button
        type="button"
        onClick={openModal}
        className="
          text-3xl
          text-blue-600
          hover:text-blue-700
          cursor-pointer
        "
        title="Fund Transfer"
      >

        <RiExchangeFundsLine />

      </button>


      {/* ================================= */}
      {/* Fund Transfer Modal */}
      {/* ================================= */}

      <Transition
        appear
        show={isOpen}
        as={Fragment}
      >

        <Dialog
          as="div"
          className="relative z-10"
          onClose={closeModal}
        >

          {/* Overlay */}

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

            <div className="
              flex
              min-h-[50vh]
              items-center
              justify-center
              p-4
              text-center
            ">


              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0 scale-95"
              >

                <Dialog.Panel
                  className="
                    w-full
                    max-w-xl
                    transform
                    overflow-hidden
                    rounded
                    bg-white
                    p-6
                    text-left
                    align-middle
                    shadow-xl
                    transition-all
                  "
                >


                  {/* ================================= */}
                  {/* Header */}
                  {/* ================================= */}

                  <Dialog.Title
                    as="h3"
                    className="
                      text-lg
                      font-medium
                      leading-6
                      text-gray-900
                      flex
                      items-center
                      justify-between
                    "
                  >

                    <span>
                      Fund Transfer
                    </span>


                    <button
                      type="button"
                      onClick={closeModal}
                      className="
                        text-2xl
                        text-black
                        p-2
                        bg-rose-100
                        rounded-full
                        cursor-pointer
                      "
                    >

                      <IoClose />

                    </button>

                  </Dialog.Title>


                  {/* ================================= */}
                  {/* Logo */}
                  {/* ================================= */}

                  <div
                    className="
                      w-full
                      py-5
                      flex
                      justify-center
                      items-center
                    "
                  >

                    <RiExchangeFundsLine
                      className="
                        text-6xl
                        text-blue-600
                      "
                    />

                  </div>


                  {/* ================================= */}
                  {/* Sender Account */}
                  {/* ================================= */}

                  <div className="w-[96%] lg:w-[80%] mx-auto">


                    <label
                      className="
                        block
                        text-sm
                        font-medium
                        text-gray-700
                        mb-1
                      "
                    >
                      From Account
                    </label>


                    <input
                      type="text"
                      value={accountNumber || ""}
                      disabled
                      className="
                        w-full
                        py-2
                        px-3
                        mb-4
                        border
                        rounded
                        bg-gray-100
                        text-gray-500
                        outline-none
                      "
                    />


                    {/* ================================= */}
                    {/* Receiver Account */}
                    {/* ================================= */}

                    <label
                      className="
                        block
                        text-sm
                        font-medium
                        text-gray-700
                        mb-1
                      "
                    >
                      Receiver Account Number
                    </label>


                    <input
                      type="text"
                      value={receiverAccount}
                      onChange={(e) =>
                        setReceiverAccount(
                          e.target.value.replace(
                            /[^0-9]/g,
                            ""
                          )
                        )
                      }
                      className="
                        w-full
                        py-2
                        px-3
                        mb-4
                        border
                        rounded
                        outline-none
                        focus:border-blue-500
                      "
                      placeholder="Enter account number"
                    />


                    {/* ================================= */}
                    {/* Amount */}
                    {/* ================================= */}

                    <label
                      className="
                        block
                        text-sm
                        font-medium
                        text-gray-700
                        mb-1
                      "
                    >
                      Amount
                    </label>


                    <div
                      className="
                        mb-5
                        flex
                        items-center
                        gap-x-2
                        border
                        w-full
                        px-3
                        rounded
                      "
                    >

                      <RiMoneyRupeeCircleLine
                        className="text-2xl"
                      />


                      <input
                        type="text"
                        value={amount}
                        onChange={(e) =>
                          setAmount(
                            e.target.value.replace(
                              /[^0-9]/g,
                              ""
                            )
                          )
                        }
                        className="
                          w-full
                          py-2
                          outline-none
                          border-none
                          rounded
                        "
                        placeholder="Enter amount"
                      />

                    </div>


                    {/* ================================= */}
                    {/* Transfer Button */}
                    {/* ================================= */}

                    <button
                      type="button"
                      disabled={
                        !receiverAccount ||
                        !amount ||
                        parseInt(amount) < 1 ||
                        loading
                      }
                      onClick={handleTransfer}
                      className="
                        px-5
                        flex
                        items-center
                        gap-x-2
                        w-full
                        bg-blue-600
                        hover:bg-blue-700
                        text-white
                        py-2
                        disabled:bg-blue-300
                        justify-center
                        rounded
                      "
                    >

                      <RiExchangeFundsLine
                        className="text-xl"
                      />

                      {loading
                        ? "Processing..."
                        : "Transfer Money"
                      }

                    </button>

                  </div>

                </Dialog.Panel>

              </Transition.Child>

            </div>

          </div>

        </Dialog>

      </Transition>

    </>
  );
}
