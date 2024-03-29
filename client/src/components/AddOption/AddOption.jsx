import { useState, useEffect } from "react";
import useEth from "../../contexts/EthContext/useEth";
import Web3 from "web3";
import Form from "react-bootstrap/Form";
import { getUrlVars, getRPCErrorMessage } from "../../Handlers/utils";
// import AddressImport from "./AddressImport";
// import DAOTokenImport from "./DAOTokenImport";
// import {textAreaIterator, excelIterator, jsonIterator} from '../../Handlers/iteratorHandler'
// import React, { useReducer, useCallback } from "react";
// var ethers = require('ethers');
import { useNavigate } from "react-router-dom";

export const AddOption = () => {
	const web3 = new Web3(Web3.givenProvider || "ws://localhost:7545");
	const navigate = useNavigate();
	const {
		state: { accounts, contract },
	} = useEth();

	const [optionDetails, setOptionDetails] = useState({
		pollId: getUrlVars()["pid"],
		optionId: "demo",
		optionName: "",
		optionDescription: "",
		voteCount: 0,
	});

	useEffect(() => {
		try {
			const getPollDetails = async () => {
				return await contract?.methods
					.getPollDetails(
						getUrlVars()["pid"],
						Math.floor(Date.now() / 1000)
					)
					.call({ from: accounts[0] });
			};

			const isPollLive = async () => {
				return await contract?.methods
					.isPollLive(getUrlVars()["pid"])
					.call({ from: accounts[0] });
			};
			isPollLive()
				.then((d) => {
					if (d)
						return navigate(
							`/manage/poll/modify?pid=${
								getUrlVars()["pid"]
							}&error=1&msg=You cannot add an option after the poll is live!`
						);
				})
				.catch((e) =>
					console.log("Addoption.jsx -> isPollLive().catch() ", e)
				);

			getPollDetails().catch((e) => {
				let commString =
					"VM Exception while processing transaction: revert ";
				if (e.toString().includes(commString)) {
					let emsg = getRPCErrorMessage(e);
					console.log("----ManagePoll.jsx----", emsg);
					navigate("/?error=1&msg=" + emsg);
				} else {
					// alert("unknown error occured");
					console.log("addoptionjsx ->getpolldetails().catch()");
					throw new Error(e);
				}
			});
		} catch (e) {
			console.error(e);
		}
	}, [contract, accounts, navigate]);

	const handleAddOptionSubmit = async (event) => {
		event.preventDefault();
		if (optionDetails.optionName === "")
			return alert("please enter the title");

		let hash = web3.utils.sha3(JSON.stringify(optionDetails));
		let signature = await web3.eth.personal
			.sign(hash, accounts[0])
		let r = signature.slice(0, 66);
		let s = "0x" + signature.slice(66, 130);
		let v = parseInt(signature.slice(130, 132), 16);
		let value = await contract.methods
			.addPollOption(optionDetails, hash, r, s, v)
			.send({ from: accounts[0] })
			.catch((e) => {
				alert("user cancelled the operation");
			});
		let a = await value.events["evAddPollOption"].returnValues["added"];
		if (a) {
			navigate(
				`/manage/poll/modify?pid=${
					getUrlVars()["pid"]
				}&success=true&msg=option added successfully`
			);
		} else {
			navigate(
				`/manage/poll/modify?pid=${
					getUrlVars()["pid"]
				}&error=true&msg=there was some issue adding option`
			);
		}
	};

	return (
		<Form onSubmit={(e) => handleAddOptionSubmit(e)}>
			{/* option title */}
			<Form.Group className="mb-3" controlId="optionTitle">
				<Form.Label>Option Title</Form.Label>
				<Form.Control
					type="text"
					name="optionTitle"
					placeholder="Option Title"
					value={optionDetails.optionName}
					onChange={(e) =>
						setOptionDetails({
							...optionDetails,
							optionName: e.target.value,
						})
					}
					required
				/>
			</Form.Group>

			{/* optionDescription */}
			<Form.Group className="mb-3" controlId="optionDescription">
				<Form.Label>Option Description</Form.Label>
				<Form.Control
					as="textarea"
					name="optionDescription"
					rows={3}
					placeholder="Brief description for the option"
					value={optionDetails.optionDescription}
					onChange={(e) =>
						setOptionDetails({
							...optionDetails,
							optionDescription: e.target.value,
						})
					}
				/>
			</Form.Group>

			{/* Submit poll */}
			<button className="submit"> {"Create option".toUpperCase()}</button>
		</Form>
	);
};
// };
