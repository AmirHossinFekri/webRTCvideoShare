const socket = io('localhost:3000');

const {RTCPeerConnection , RTCSessionDescription}=window;

let isAlreadyCall=false;
let getCalled= false;

const peerConnection=new RTCPeerConnection();

async function callUser(socketID){
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(new RTCSessionDescription(offer));

    socket.emit("call-user",{
        offer,
        to:socketID
    })
}

function unselectUser() {
    const alreadySelected =document.querySelectorAll('.active-user.active-user--selected')

    alreadySelected.forEach(element =>{
        element.setAttribute('class','active-user');
    })
}

socket.on('Update-User-List',({users})=>{
    const ActiveUser=document.getElementById('active-user-container');

    users.forEach(socketId => {
        const UserExist=document.getElementById(socketId)

        if(!UserExist){
            const userContaner=document.createElement('div');

            const username= document.createElement('p');

            userContaner.setAttribute('class','active-user');
            userContaner.setAttribute('id',socketId);
            username.setAttribute('class','username');

            username.innerHTML=`کاربر ${socketId}`;

            userContaner.appendChild(username);

            userContaner.addEventListener('click',()=>{
                unselectUser();
                userContaner.setAttribute('class','active-user active-user--selected');
                const talkingInfo=document.getElementById('talking-with-info');

                talkingInfo.innerHTML=`تماس با سوکت ${socketId}`;
                callUser(socketId)
            })

            ActiveUser.appendChild(userContaner);
        }
    });

});

socket.on('remove-user',({socketId})=>{
    const user=document.getElementById(socketId);

    if(user) user.remove();

})
socket.on('call-made',async data=>{
    if(getCalled){
    const confirmed=confirm(`کاربر با آیدی ${data.socket} میخواهد با شما تماس برقرار کند قبول می کنید؟`);
    if(!confirmed){
        socket.emit('reject-call',{
            from:data.socket
        })
        return;
    }
}
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));

    const answer=await peerConnection.createAnswer();

    await peerConnection.setLocalDescription(new RTCSessionDescription(answer));
    socket.emit('make-answer',{
        answer,
        to:data.socket
    })
    getCalled=true;
})


socket.on('answer-made',async data=>{
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    if(!isAlreadyCall){
        callUser(data.socket);
        isAlreadyCall=true;
    }
})

socket.on('call-rejected',(data)=>{
     alert("کاربر مورد نظر تماس شما را قبول نکرد");
    unselectUser();
    })

peerConnection.ontrack=function({streams:[stream]}){

    const remoteVideo=document.getElementById('remote-video');

    if(remoteVideo){
        remoteVideo.srcObject=stream;
    }

}

navigator.getUserMedia({video:true,audio:true},stram=>{
    const localVideos=document.getElementById('local-video');

    if(localVideos){
        localVideos.srcObject=stram;
    }
    stram.getTracks().forEach((track)=> peerConnection.addTrack(track,stram));

},err=>{
    console.log(err.massage);
});