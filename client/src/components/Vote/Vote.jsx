import { useEffect, useState } from "react";
import useEth from "../../contexts/EthContext/useEth";
import {
	getUrlVars,
	getRPCErrorMessage,
	num2alpha,
} from "../../Handlers/utils";
import { useNavigate } from "react-router-dom";
import Toast from "react-bootstrap/Toast";
import {VscError} from 'react-icons/vsc'
import Form from "react-bootstrap/Form";
import Web3 from "web3";
import "./Vote.css";

export const Vote = () => {
	const {
		state: { accounts, contract },
	} = useEth();
	const [showErr, setShowError] = useState(0)
	const [selected, setSelected] = useState({class: "", option: {}})
	const navigate = useNavigate();
	const [options, setOptions] = useState({
		fetched: false,
		data: [
			{
				optionId: "loading",
				optionName: "loading",
				pollId: "loading",
				optionDescription: "",
			},
		],
	});

	const [poll, setPoll] = useState({
		fetched: false,
		data: {},
	});
	const web3 = new Web3(Web3.givenProvider || "ws://localhost:7545");
	// const [result, setResult] = useState({
	//     fetched: false,
	//     data: {

	//     }
	// })


	useEffect(() => {
		const checkPollIdForVoter = async () =>
			await contract?.methods
				.getPollDetailsForVoting(
					getUrlVars()["pid"],
					Math.floor(Date.now() / 1000)
				)
				.call({ from: accounts[0] });

		const fetchPollOptions = async () =>
			await contract?.methods
				.fetchPollOptions(getUrlVars()["pid"])
				.call({ from: accounts[0] });

		checkPollIdForVoter()
			.then((datar) => {
				setPoll((prevState) => ({
					...prevState,
					fetched: true,
					data: {
						...datar,
					},
				}));
			})
			.catch((e) => {
				console.log(e);
				let commString =
					"VM Exception while processing transaction: revert ";
				if (e.toString().includes(commString)) {
					let emsg = getRPCErrorMessage(e);
					console.log("----Vote.jsx----", emsg);
					navigate("/?error=1&msg=" + emsg);
					// window.location.href = "/?error=1&msg=" + emsg;
				} else {
					console.log(
						"error found at Vote.jsx, checkPollIdForVoter().catch"
					);
					throw new Error(e);
				}
			});

		fetchPollOptions()
			.then((datar) => {
				setOptions((prevState) => ({
					...prevState,
					fetched: true,
					data: datar,
				}));
			})
			.catch((e) => {
				console.log(e);
				let commString =
					"VM Exception while processing transaction: revert ";
				if (e.toString().includes(commString)) {
					let emsg = getRPCErrorMessage(e);
					console.log("----ManagePoll.jsx----", emsg);
					navigate("/?error=1&msg=" + emsg);
					// window.location.href = "/?error=1&msg=" + emsg;
				} else {
					console.log(
						"error found at Vote.jsx, fetchPollOptions().catch"
					);
					throw new Error(e);
				}
			});
	}, [accounts, contract, navigate]);
	const [allowed, setAllowed] = useState(false)


	const hasUserVoted = async () => contract?.methods?.getUserVote(getUrlVars()['pid']).call({from: accounts[0]}).then((d) => d)
	let 		handleSubmitVote = async (e) => {
		if (!allowed) return;
		e.preventDefault();
		document.getElementById("submitBtnForVote").disabled = true;
		if(selected.class=== "") {
			document.getElementById("submitBtnForVote").disabled = false;
			displayErrMsg()
			return navigate(`${window.location.pathname}?error=true&msg=please choose an option first&pid=${getUrlVars()['pid']}`)
		}
		
			let hash = web3.utils.sha3(JSON.stringify({pid: getUrlVars()['pid'], oid: options.data.optionId}));
		let signature = await web3.eth.personal
			.sign(hash, accounts[0])
			.catch((e) => {
				console.log(e);
			});
		let r = signature.slice(0, 66);
		let s = "0x" + signature.slice(66, 130);
		let v = parseInt(signature.slice(130, 132), 16);
		let value = await contract.methods.castVote(
				getUrlVars()['pid'],
				selected.option.optionId,
				hash,
				r,
				s,
				v
			)
			.send({ from: accounts[0] })
			.catch((e) => {
				console.log(e);
				// alert("user cancelled the vote", "hh");
				let commString =
				"VM Exception while processing transaction: revert ";
				let emsg = e.message.split(commString)[1].split("\",")[0];
				console.log("----ManagePoll.jsx----", emsg);
				navigate('/?error=1&msg=' + emsg)					});
		// alert("hi")
		console.log(await value);
		let a = await value.events["evCastVote"].returnValues[
			"wasSuccessful"
		];
		if (a) {
			window.location.reload()
		}
		document.getElementById("submitBtnForVote").disabled = false;
	};

	hasUserVoted().then(d => {
		if(d.hasVoted) {
			// alert('voted')
			document.getElementById("submitBtnForVote").disabled = true;
			document.getElementById(d.vote.optionId).className = "option chosen"
			let _options =document.getElementsByClassName("option")
			for (let ind = 0; ind < _options.length; ind++) {
				if(_options[ind].className === "option") {
					console.log(_options[ind])
					_options[ind].style.background = "rgba(155,155,155,.3)"
					_options[ind].style.cursor = "not-allowed"
					_options[ind].onclick = null;
					var new_element = _options[ind].cloneNode(true);
					_options[ind].parentNode.replaceChild(new_element, _options[ind]);	
				} else {
					let commString = "You've voted for the following option"
					if(!_options[ind].parentElement.innerText.includes(commString)){
						var element = document.createElement("div")
						element.style.fontSize ="small"
						element.style.color = "green"
						element.innerText = commString
						_options[ind].parentElement.insertBefore(element, _options[ind].parentElement.children[ind])}
				}
				
			}
		} else {
			// alert("not voted")
			if(!allowed) {
				setAllowed(true)
			}
		}
	}).catch(d => {
		// alert("Network Connection Error")
		console.log(d)
	})
	
	const displayErrMsg = () => {
		setShowError(1)
		setTimeout(()=>setShowError(0),5000)
	}



	////new end
	return (
		<>			<div className={showErr ? "fadeOut": 'hide'} style={{width: "inherit"}}>
		{getUrlVars()["error"] ? (
		<Toast style={{background: "#ffb7b7", color: "black", border: "1.5px solid #d67c7c", width: "fit-content"}}
		className="lg-toast"
		// bg={"danger"}
		autohide={true}
		delay={5000}>
	
		<Toast.Body className="text-red" style={{fontSize: "2rem",width: "max-content", fontFamily: "'Lexend', sans-serif", textTransform: "uppercase", display: "flex", justifyContent: "center" }}>
			<VscError/>&nbsp;&nbsp;
			{decodeURIComponent(getUrlVars()["msg"])}
		</Toast.Body>
	</Toast>
		) : (
			""
		)}
	</div><div className="wrapper">

			<header>{poll.fetched ? poll.data.pollName : "loading.."}</header>
			<p>{poll.fetched ? poll.data.pollDescription : "loading.."}</p>
			<div classnam="poll-area">
				{!options.fetched ? (
					<>
						<span className="card is-loading">
							<h2></h2>
							<h2></h2>
							<h2></h2>
							<h2></h2>
						</span>
					</>
				) : (
					<Form
						style={{ boxShadow: "initial", padding: "0" }}
						onSubmit={(e) => handleSubmitVote(e)}>
						{options?.data?.map((v, i) => (
							<div key={`opt-${i + 1}`} id={v.optionId} className={selected.class === `opt-${i+1}` ? 'option chosen' : 'option'} onClick={(e) => setSelected((prevState) => ({
								...prevState,
								class:  `opt-${i+1}`,
								option: {
									...prevState.option,
									...v
								}
							}))} title={v.optionDescription.trim() !== "" ? v.optionDescription : v.optionName}>
								<span className="option-title">
									<span style={{ width: "10%" }}>
										&nbsp;{num2alpha(i + 1)}.
									</span>
									{v.optionName}
								</span>
							</div>
						))}{" "}
						<button
							id="submitBtnForVote"
							className="btn btn-success w-100 text-uppercase text-large managePollBtn">
							Sign & Vote
						</button>
					</Form>
				)}
			</div>
		</div></>
		
	);
};

// poll exists
// poll has started ????
// poll has ended ????
// if poll type is not public then check if msg.sender is in addressList
