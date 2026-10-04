"use client";

import CustomAuthButton from "@/components/reuseable/CustomAuthButton";
import { useMainContext } from "@/context/MainContext";
import { axiosClient } from "@/utils/AxiosClient";
import { Dialog, Transition } from "@headlessui/react";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { Fragment, useState } from "react";
import { LiaPlusSolid } from "react-icons/lia";
import { RiCloseLargeLine } from "react-icons/ri";
import { toast } from "react-toastify";
import * as yup from "yup";

export default function AddNewFdModel({ isUpdate, setIsUpdate }) {

    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const { user, fetchUserProfile } = useMainContext();

    const initialStates = {
        amount: 0,
        account: "",
        apply_for: "",
        tenure_months: ""
    };

    const validationSchema = yup.object({
        amount: yup
            .number()
            .min(1, "Minimum ₹1 required")
            .required("Amount is required"),

        account: yup
            .string()
            .required("Account is required"),

        apply_for: yup
            .string()
            .required("Purpose is required"),

        tenure_months: yup
            .number()
            .oneOf(
                [6, 12, 24, 36],
                "Please select a valid FD tenure"
            )
            .required("Tenure is required")
    });

    const onSubmitHandler = async (values, { resetForm }) => {

        try {

            setLoading(true);

            const response = await axiosClient.post(
                "/fd/add-new",
                {
                    ...values,
                    amount: Number(values.amount),
                    tenure_months: Number(values.tenure_months)
                }
            );

            const data = await response.data;

            await fetchUserProfile();

            toast.success(data.msg);

            resetForm();

            closeModal();

        } catch (error) {

            toast.error(
                error?.response?.data?.msg ||
                error?.message ||
                "Something went wrong"
            );

        } finally {

            setLoading(false);
            setIsUpdate(!isUpdate);
        }
    };

    function closeModal() {
        setIsOpen(false);
    }

    function openModal() {
        setIsOpen(true);
    }

    return (
        <>
            <div
                onClick={openModal}
                className="w-full border border-dashed border-rose-700 rounded shadow px-4 py-3 flex items-center justify-center flex-col hover:bg-rose-700 hover:text-white transition-all duration-300 cursor-pointer text-rose-700"
            >
                <LiaPlusSolid className="text-5xl transition-all duration-300" />

                <p className="transition-all duration-300 font-medium">
                    Add New +
                </p>
            </div>

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

                                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">

                                    <Dialog.Title
                                        as="div"
                                        className="text-lg flex items-center justify-between font-medium leading-6 text-gray-900"
                                    >

                                        <p>
                                            Apply New Fixed Deposit
                                        </p>

                                        <button
                                            onClick={closeModal}
                                            type="button"
                                            className="text-xl p-2 bg-rose-100 rounded-full text-rose-700 cursor-pointer"
                                        >
                                            <RiCloseLargeLine />
                                        </button>

                                    </Dialog.Title>

                                    <div className="mt-2">

                                        <p className="text-sm text-gray-500">
                                            Choose your FD tenure. Interest
                                            rate is decided by the bank.
                                        </p>

                                    </div>

                                    <Formik
                                        validationSchema={validationSchema}
                                        onSubmit={onSubmitHandler}
                                        initialValues={initialStates}
                                    >

                                        <Form className="py-5">

                                            {/* Purpose */}

                                            <div className="mb-3">

                                                <label htmlFor="apply_for">
                                                    Purpose
                                                </label>

                                                <Field
                                                    type="text"
                                                    name="apply_for"
                                                    id="apply_for"
                                                    className="w-full bg-transparent border border-rose-500 rounded-md py-3 px-4 outline-none"
                                                    placeholder="Enter FD Purpose..."
                                                />

                                                <ErrorMessage
                                                    className="text-red-500"
                                                    component="p"
                                                    name="apply_for"
                                                />

                                            </div>


                                            {/* Amount */}

                                            <div className="mb-3">

                                                <label htmlFor="amount">
                                                    Amount
                                                </label>

                                                <Field
                                                    type="number"
                                                    name="amount"
                                                    id="amount"
                                                    className="w-full bg-transparent border border-rose-500 rounded-md py-3 px-4 outline-none"
                                                    placeholder="Enter FD Amount"
                                                />

                                                <ErrorMessage
                                                    className="text-red-500"
                                                    component="p"
                                                    name="amount"
                                                />

                                            </div>


                                            {/* Tenure */}

                                            <div className="mb-3">

                                                <label htmlFor="tenure_months">
                                                    FD Tenure
                                                </label>

                                                <Field
                                                    as="select"
                                                    name="tenure_months"
                                                    id="tenure_months"
                                                    className="w-full bg-transparent border border-rose-500 rounded-md py-3 px-4 outline-none"
                                                >

                                                    <option value="">
                                                        Select Tenure
                                                    </option>

                                                    <option value="6">
                                                        6 Months — 6% p.a.
                                                    </option>

                                                    <option value="12">
                                                        1 Year — 7% p.a.
                                                    </option>

                                                    <option value="24">
                                                        2 Years — 7.5% p.a.
                                                    </option>

                                                    <option value="36">
                                                        3 Years — 8% p.a.
                                                    </option>

                                                </Field>

                                                <ErrorMessage
                                                    className="text-red-500"
                                                    component="p"
                                                    name="tenure_months"
                                                />

                                            </div>


                                            {/* Account */}

                                            <div className="mb-3">

                                                <label htmlFor="account">
                                                    Account
                                                </label>

                                                <Field
                                                    as="select"
                                                    name="account"
                                                    id="account"
                                                    className="w-full bg-transparent border border-rose-500 rounded-md py-3 px-4 outline-none"
                                                >

                                                    {
                                                        user &&
                                                        user?.account_no &&
                                                        user.account_no.length > 0
                                                            ?
                                                            <>
                                                                <option value="">
                                                                    Select
                                                                </option>

                                                                {
                                                                    user.account_no.map(
                                                                        (cur, i) => (
                                                                            <option
                                                                                key={i}
                                                                                value={cur._id}
                                                                            >
                                                                                {`${cur._id} - ₹${cur.amount}`}
                                                                            </option>
                                                                        )
                                                                    )
                                                                }
                                                            </>
                                                            :
                                                            <option value="">
                                                                No Account Available
                                                            </option>
                                                    }

                                                </Field>

                                                <ErrorMessage
                                                    className="text-red-500"
                                                    component="p"
                                                    name="account"
                                                />

                                            </div>


                                            {/* Submit */}

                                            <div className="mb-3">

                                                <CustomAuthButton
                                                    isLoading={loading}
                                                    text="Add FD"
                                                />

                                            </div>

                                        </Form>

                                    </Formik>

                                </Dialog.Panel>

                            </Transition.Child>

                        </div>

                    </div>

                </Dialog>

            </Transition>
        </>
    );
}
