import React, { useEffect, useRef, useState } from "react";
import SignalCelluralAltIcon from "@material-ui/icons/SignalCellularAlt";
import CallIcon from "@material-ui/icons/Call";
import styles from "../../../styles/components/chat/navbar/NavbarVoice.module.scss";
import {
  DocumentData,
  QuerySnapshot,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { createFirebaseApp } from "firebase-utils/clientApp";
import { useChannel } from "context/channelContext";
import { useUser } from "context/userContext";

interface RemoteStream {
  id: number;
  stream: MediaStream;
}

export const NavbarVoice: React.FC = ({}) => {
  const { channel, setChannelVoice } = useChannel();
  const { user } = useUser();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const [lastVoiceId, setLastVoiceId] = useState<string>(channel.voiceId);
  const [peerConnections, setPeerConnections] = useState<RTCPeerConnection[]>(
    []
  );

  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const remoteAudioRefs = useRef<(HTMLAudioElement | null)[]>([]);

  const app = createFirebaseApp();
  const db = getFirestore(app!);

  const servers: RTCConfiguration = {
    iceServers: [
      {
        urls: [
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
        ],
      },
    ],
    iceCandidatePoolSize: 10,
  };

  const channelRef = doc(
    db,
    "groups",
    channel.idG,
    "channels",
    channel.voiceId ? channel.voiceId : lastVoiceId
  );

  useEffect(() => {
    // Request access to the user's audio device
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        setLocalStream(stream);
        if (localAudioRef.current) {
          localAudioRef.current.srcObject = stream;
        }
      })
      .catch((error) => {
        console.error("Error Accessing Audio Device: ", error);
      });
  }, []);

  useEffect(() => {
    if (channel.voiceId != "") setLastVoiceId(channel.voiceId);
  }, [channel.voiceId]);

  const createPeerConnection = (): RTCPeerConnection => {
    const peerConnection = new RTCPeerConnection(servers);

    // Add the local stream to the peer connection
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
      });
    }

    // Set up event handlers for ICE candidates and remote stream
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send the ICE candidate to other participants
        setDoc(
          doc(channelRef, "candidates", user.uid),
          event.candidate.toJSON()
        );
      }
    };

    peerConnection.ontrack = (event) => {
      // Add the remote stream to the list of remote streams
      setRemoteStreams((prevStreams) => [
        ...prevStreams,
        { id: remoteAudioRefs.current.length, stream: event.streams[0] },
      ]);
    };

    return peerConnection;
  };

  const handleReceiveCandidates = (snapshot: QuerySnapshot<DocumentData>) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const candidate = new RTCIceCandidate(change.doc.data());
        peerConnections.forEach((peerConnection) => {
          peerConnection.addIceCandidate(candidate).catch((error) => {
            console.error("Error adding ICE candidate:", error);
          });
        });
      }
    });
  };

  const handleReceiveOffers = (snapshot: QuerySnapshot<DocumentData>) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const offer = change.doc.data();
        const peerConnection = createPeerConnection();
        setPeerConnections((prevConnections) => [
          ...prevConnections,
          peerConnection,
        ]);

        peerConnection
          .setRemoteDescription(
            new RTCSessionDescription(offer as RTCSessionDescription)
          )
          .then(() => peerConnection.createAnswer())
          .then((answer) => peerConnection.setLocalDescription(answer))
          .then(() => {
            // Send the answer to the offerer
            setDoc(
              doc(channelRef, "answers", user.uid),
              peerConnection.localDescription!.toJSON()
            );
          })
          .catch((error) => {
            console.error("Error creating WebRTC answer:", error);
          });
      }
    });
  };

  const handleReceiveAnswers = (snapshot: QuerySnapshot<DocumentData>) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const answer = change.doc.data();
        const peerConnection = peerConnections.find(
          (connection) => connection.localDescription?.sdp === answer.sdp
        );
        if (peerConnection) {
          peerConnection.setRemoteDescription(
            new RTCSessionDescription(answer as RTCSessionDescription)
          );
        }
      }
    });
  };

  useEffect(() => {
    const handleStartCall = () => {
      const peerConnection = createPeerConnection();
      setPeerConnections((prevConnections) => [
        ...prevConnections,
        peerConnection,
      ]);

      peerConnection
        .createOffer()
        .then((offer) => peerConnection.setLocalDescription(offer))
        .then(() => {
          // Send the offer to other participants via Firebase Firestore
          setDoc(
            doc(channelRef, "offers", user.uid),
            peerConnection.localDescription!.toJSON()
          );
        })
        .catch((error) => {
          console.error("Error creating WebRTC offer:", error);
        });
    };

    const candidatesRef = collection(channelRef, "candidates");
    const unsubscribeCandidates = onSnapshot(
      candidatesRef,
      handleReceiveCandidates
    );

    const offersRef = collection(channelRef, "offers");
    const unsubscribeOffers = onSnapshot(offersRef, handleReceiveOffers);

    const answersRef = collection(channelRef, "answers");
    const unsubscribeAnswers = onSnapshot(answersRef, handleReceiveAnswers);

    handleStartCall();

    return () => {
      deleteDoc(doc(channelRef, "candidates", user.uid));
      deleteDoc(doc(channelRef, "answers", user.uid));
      deleteDoc(doc(channelRef, "offers", user.uid));
      unsubscribeCandidates();
      unsubscribeOffers();
      unsubscribeAnswers();
    };
  }, []);

  return (
    <div className={styles.voice}>
      <div>
        <audio ref={localAudioRef} autoPlay muted />
      </div>
      {remoteStreams.map((remoteStream) => (
        <audio
          key={remoteStream.id}
          ref={(ref) => {
            if (ref) {
              ref.srcObject = remoteStream.stream;
              remoteAudioRefs.current[remoteStream.id] = ref;
            }
          }}
          autoPlay
        />
      ))}
      <SignalCelluralAltIcon
        className={styles.connection_icon}
        fontSize="large"
      />
      <div className={styles.info}>
        <h4>Voice Connected</h4>
        <p>Voice Channel</p>
      </div>
      <div className={styles.icons}>
        <CallIcon className={styles.icon} onClick={() => setChannelVoice("")} />
      </div>
    </div>
  );
};
