import { useFriendContext } from "../context/FriendContext";

export default function FriendPanel() {
	const {
		requests,
		friends,
		acceptRequest,
		denyRequest,
		revoke,
		sendRequest
	} = useFriendContext();

	return (
		<div className="ui-panel" style={{ right: 10, top: 10, width: 220 }}>
			<div className="ui-section-title">Friend Sharing</div>

			{/* Requests Section */}
			<div>
				<strong>Requests:</strong>
				{requests.length === 0 && <div>No Requests</div>}
				{requests.map(req => (
					<div key={req.id} style={{ marginTop: 4 }}>
						{req.name}
						<button className="ui-btn" onClick={() => acceptRequest(req)}>
							Accept
						</button>
						<button className="ui-btn" onClick={() => denyRequest(req)}>
							Deny
						</button>
					</div>
				))}
			</div>

			{/* Active Friends */}
			<div style={{ marginTop: 8 }}>
				<strong>Active Friends:</strong>
				{friends.length === 0 && <div>No Active</div>}
				{friends.map(friend => (
					<div key={friend.id} style={{ marginTop: 4 }}>
						{friend.name}
						<button className="ui-btn" onClick={() => revoke(friend)}>
							Revoke
						</button>
					</div>
				))}
			</div>

			{/* Optional Testing UI */}
			<div style={{ marginTop: 10 }}>
				<button
					className="ui-btn"
					onClick={() => sendRequest("User_" + (requests.length + 1))}
				>
					+ Fake Request
				</button>
			</div>
		</div>
	);
}
