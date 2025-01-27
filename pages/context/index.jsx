import React, { createContext, useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';

const SocketContext = createContext();


// const socket = io('https://warm-wildwood-81069.herokuapp.com');

const ContextProvider = ({ children }) => {
const socket = io('https://kartik.onrender.com/');
// const socket = io('http://localhost:9000');

    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [stream, setStream] = useState();
    const [name, setName] = useState('');
    const [call, setCall] = useState({});
    const [me, setMe] = useState('');

    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();

    useEffect(() => {

        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((currentStream) => {
                setStream(currentStream);
                //   console.log(currentStream)
                if (myVideo.current) {
                    myVideo.current.srcObject = currentStream
                    // console.log(myVideo.current.srcObject)
                }

                // myVideo.current.srcObject= currentStream;

            });

        socket.on('ime', (id) => setMe(id));



        socket.on('callUser', ({ from, name: callerName, signal }) => {
            
            setCall({ isReceivingCall: true, from, name: callerName, signal });
        });
    }, []);

    // console.log(me)
    const answerCall = () => {
        setCallAccepted(true);

        const peer = new Peer({ initiator: false, trickle: false, stream });

        peer.on('signal', (data) => {
            socket.emit('answerCall', { signal: data, to: call.from });
        });

        peer.on('stream', (currentStream) => {
            // userVideo.current.srcObject = currentStream;
            if(userVideo.current){
           

                userVideo.current.srcObject = currentStream;
                // console.log(userVideo.current.srcObject)
            }
            
            
        });

        peer.signal(call.signal);

        connectionRef.current = peer;
    };

    const callUser = (id) => {
   
        const peer = new Peer({ initiator: true, trickle: false, stream });
      
        peer.on('signal', (data) => {
            
            socket.emit('callUser', { userToCall: id, signalData: data, from: me, name });
        });

        peer.on('stream', (currentStream) => {
            
            userVideo.current.srcObject = currentStream;
           
        });

        socket.on('callAccepted', (signal) => {
            setCallAccepted(true);

            peer.signal(signal);
        }); 

        connectionRef.current = peer;
    };

    const leaveCall = () => {
        setCallEnded(true);

        connectionRef.current.destroy();

        window.location.reload();
    };

    return (
        <SocketContext.Provider value={{
            call,
            callAccepted,
            myVideo,
            userVideo,
            stream,
            name,
            setName,
            callEnded,
            me,
            callUser,
            leaveCall,
            answerCall,
        }}
        >
            {children}
        </SocketContext.Provider>
    );
};

export { ContextProvider, SocketContext };