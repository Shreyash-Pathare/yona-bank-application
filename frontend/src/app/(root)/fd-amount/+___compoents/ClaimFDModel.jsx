
"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
import moment from "moment";
import { TbCoins } from "react-icons/tb";
import { axiosClient } from "@/utils/AxiosClient";
import { toast } from "react-toastify";
import { useMainContext } from "@/context/MainContext";

const ClaimFDModel = ({ id, methods: { isUpdate, setIsUpdate } }) => {

    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);

    const { fetchUserProfile } = useMainContext();

    function closeModal() {
        setIsOpen(false);
    }

    function openModal() {
        setIsOpen(true);
    }

    const fetchFDInformation = async () => {

        try {

            setLoading(true);

            const response = await axiosClient.get(`/fd/get/${id}`);

            setData(response.data);

        } catch (error) {

            toast.error(
                error?.response?.data?.msg ||
                error?.message ||
                "Unable to fetch FD information"
            );

        } finally {

            setLoading(false);
        }
    };


    const claimedFD = async () => {

        try {

            setLoading(true);

            const response = await axiosClient.get(
                `/fd/claim/${id}`
            );

            toast.success(response.data.msg);

            setIsUpdate(!isUpdate);

            await fetchUserProfile();

            closeModal();

        } catch (error) {

            toast.error(
                error?.response?.data?.msg ||
                error?.message ||
                "Unable to claim FD"
            );

        } finally {

            setLoading(false);
        }
    };


    useEffect(() => {

        if (isOpen) {
            fetchFDInformation();
        }

    }, [isOpen]);


    const isMatured =
        data?.status === "MATURED";


    return (
        <>
            <button
                onClick={openModal}
                className="px-4 py-2 rounded border text-rose-600 border-rose-600 cursor-pointer"
            >
                Claim
            </button>


            <Transition appear show={isOpen} as={Fragment}>

                <Dialog
                    as="div"
                    className="relative z-10"
                    onClose={closeModal}
                >

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

                        <div className="flex min-h-full items-center justify-center p-4 text-center">

                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >

                                <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">

                                    <Dialog.Title
                                        as="div"
                                        className="text-lg font-medium leading-6 flex items-center justify-between text-gray-900"
                                    >

                                        <h3 className="text-2xl text-rose-500">
                                            {data?.apply_for}
                                        </h3>

                                        <button
                                            onClick={closeModal}
                                            className="text-2xl text-rose-700 cursor-pointer outline-none bg-rose-100 rounded-full p-3"
                                        >
                                            <IoClose />
                                        </button>

                                    </Dialog.Title>


                                    <div className="mt-2">

                                        <div className="w-full py-3 flex justify-center items-center">
                                            <img
                                                src="/logo.svg"
                                                alt="Logo"
                                                className="w-1/2 mx-auto"
                                            />
                                        </div>


                                        {loading && !data ? (

                                            <div className="py-10 text-center">
                                                Loading FD information...
                                            </div>

                                        ) : (

                                            <>
                                                <table className="table w-full">

                                                    <tbody className="w-full">

                                                        <tr className="border text-center">
                                                            <th className="text-center py-3 border">
                                                                Account No
                                                            </th>

                                                            <td className="text-center py-3 border px-10">
                                                                {data?.account}
                                                            </td>
                                                        </tr>


                                                        <tr className="border text-center">
                                                            <th className="text-center py-3 border">
                                                                Principal Amount
                                                            </th>

                                                            <td className="text-center py-3 border px-10">
                                                                ₹{data?.amount}
                                                            </td>
                                                        </tr>


                                                        <tr className="border text-center">
                                                            <th className="text-center py-3 border">
                                                                Interest Rate
                                                            </th>

                                                            <td className="text-center py-3 border px-10">
                                                                {data?.interest_rate}% p.a.
                                                            </td>
                                                        </tr>


                                                        <tr className="border text-center">
                                                            <th className="text-center py-3 border">
                                                                Tenure
                                                            </th>

                                                            <td className="text-center py-3 border px-10">
                                                                {data?.tenure_months} Months
                                                            </td>
                                                        </tr>


                                                        <tr className="border text-center">
                                                            <th className="text-center py-3 border">
                                                                Interest Amount
                                                            </th>

                                                            <td className="text-center py-3 border px-10">
                                                                ₹{data?.interest_amount}
                                                            </td>
                                                        </tr>


                                                        <tr className="border text-center">
                                                            <th className="text-center py-3 border">
                                                                Maturity Amount
                                                            </th>

                                                            <td className="text-center py-3 border px-10 font-semibold">
                                                                ₹{data?.maturity_amount}
                                                            </td>
                                                        </tr>


                                                        <tr className="border text-center">
                                                            <th className="text-center py-3 border">
                                                                Apply Date
                                                            </th>

                                                            <td className="text-center py-3 border px-10">
                                                                {data?.date
                                                                    ? moment(data.date).format("LL")
                                                                    : "-"
                                                                }
                                                            </td>
                                                        </tr>


                                                        <tr className="border text-center">
                                                            <th className="text-center py-3 border">
                                                                Maturity Date
                                                            </th>

                                                            <td className="text-center py-3 border px-10">
                                                                {data?.maturity_date
                                                                    ? moment(data.maturity_date).format("LL")
                                                                    : "-"
                                                                }
                                                            </td>
                                                        </tr>


                                                        <tr className="border text-center">
                                                            <th className="text-center py-3 border">
                                                                Status
                                                            </th>

                                                            <td className="text-center py-3 border px-10">
                                                                <span
                                                                    className={
                                                                        data?.status === "MATURED"
                                                                            ? "text-green-600 font-semibold"
                                                                            : "text-orange-500 font-semibold"
                                                                    }
                                                                >
                                                                    {data?.status}
                                                                </span>
                                                            </td>
                                                        </tr>

                                                    </tbody>

                                                </table>


                                                <div className="py-5">

                                                    <button
                                                        onClick={claimedFD}
                                                        disabled={
                                                            loading ||
                                                            !isMatured
                                                        }
                                                        className="w-full rounded py-2 flex justify-center items-center gap-x-2 bg-rose-600 disabled:bg-gray-400 text-white capitalize text-xl"
                                                    >

                                                        <span>
                                                            {
                                                                isMatured
                                                                    ? "Claim"
                                                                    : "Not Matured"
                                                            }
                                                        </span>

                                                        <TbCoins className="text-2xl" />

                                                    </button>

                                                </div>

                                                {
                                                    !isMatured &&
                                                    data?.maturity_date && (

                                                        <p className="text-center text-sm text-gray-500">
                                                            You can claim this FD after{" "}
                                                            <b>
                                                                {moment(
                                                                    data.maturity_date
                                                                ).format("LL")}
                                                            </b>
                                                        </p>

                                                    )
                                                }

                                            </>

                                        )}

                                    </div>

                                </Dialog.Panel>

                            </Transition.Child>

                        </div>

                    </div>

                </Dialog>

            </Transition>
        </>
    );
};

export default ClaimFDModel;
