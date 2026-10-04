
"use client";

import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import ClaimFDModel from "./ClaimFDModel";

const FDCard = ({ data, isUpdate, setIsUpdate }) => {

    const [isShow, setIsShow] = useState(false);

    const amount = String(data?.amount || 0);

    const statusColor = {
        ACTIVE: "text-orange-500",
        MATURED: "text-green-600",
        CLAIMED: "text-blue-600",
        PREMATURE_CLOSED: "text-red-600"
    };

    return (
        <div className="py-4 px-4 w-full shadow border rounded flex flex-col gap-y-3">

            <div className="flex justify-between items-start gap-2">

                <h2 className="text-2xl font-medium">
                    {data?.apply_for}
                </h2>

                <span
                    className={`text-sm font-semibold ${
                        statusColor[data?.status] || "text-gray-500"
                    }`}
                >
                    {data?.status}
                </span>

            </div>


            <div className="text-2xl text-start w-full font-bold text-zinc-950 flex items-center gap-x-2">

                <span>
                    ₹ {isShow
                        ? Number(amount).toLocaleString("en-IN")
                        : "".padStart(amount.length, "x")
                    }/-
                </span>

                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsShow(!isShow);
                    }}
                    type="button"
                    className="outline-none cursor-pointer text-rose-700"
                >
                    {!isShow
                        ? <FaEye />
                        : <FaEyeSlash />
                    }
                </button>

            </div>


            <div className="grid grid-cols-2 gap-2 text-sm">

                <div className="border rounded p-2">
                    <p className="text-gray-500">
                        Interest Rate
                    </p>

                    <p className="font-semibold">
                        {data?.interest_rate}% p.a.
                    </p>
                </div>


                <div className="border rounded p-2">
                    <p className="text-gray-500">
                        Tenure
                    </p>

                    <p className="font-semibold">
                        {data?.tenure_months} Months
                    </p>
                </div>


                <div className="border rounded p-2">
                    <p className="text-gray-500">
                        Maturity Amount
                    </p>

                    <p className="font-semibold">
                        ₹ {Number(
                            data?.maturity_amount || 0
                        ).toLocaleString("en-IN")}
                    </p>
                </div>


                <div className="border rounded p-2">
                    <p className="text-gray-500">
                        Maturity Date
                    </p>

                    <p className="font-semibold">
                        {data?.maturity_date
                            ? new Date(
                                data.maturity_date
                            ).toLocaleDateString("en-IN")
                            : "-"
                        }
                    </p>
                </div>

            </div>


            <div className="flex justify-end items-center pt-2">

                <ClaimFDModel
                    methods={{
                        isUpdate,
                        setIsUpdate
                    }}
                    id={data?._id}
                />

            </div>

        </div>
    );
};

export default FDCard;
