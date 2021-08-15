// Change to your lambda endpoint here
var lambdaurl = 'https://79hxxpdvf2.execute-api.ap-southeast-1.amazonaws.com/alpha';

var audioStream; 						//stream from getUserMedia()
var rec; 							//Recorder.js object
var input; 							//MediaStreamAudioSourceNode we'll be recording
demosite = false;
if (document.location.origin.indexOf("localhost") != -1 || document.location.origin.indexOf("covcough.surge.sh") != -1) {
	document.getElementById("name").value = "demositedata_pleaseignore"
	document.getElementById("name").style.display = "none";
	demosite = true;
}

navigator.mediaDevices.getUserMedia({ audio: true })
	.then(function (stream) {
		console.log('We have microphone permission!')
	})
	.catch(function (err) {
		console.log('No microphone permission!')
		document.body.classList.add("showmodal");
		updatemodaltext(nomictxt, false)
	});

// document.body.classList.add("showmodal");

// shim for AudioContext when it's not avb. 
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext //audio context to help us record

var brec = document.getElementById("brec");
var bstop = document.getElementById("bstop");
var bpause = document.getElementById("bpause");

//add events to those 2 buttons
brec.addEventListener("click", startRecording);
bstop.addEventListener("click", stopRecording);
bpause.addEventListener("click", pauseRecording);


function startRecording() {
	console.log("brec clicked");
	var constraints = { audio: true, video: false }
	brec.disabled = true;
	bstop.disabled = false;
	bpause.disabled = false

	navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
		console.log("Initializing Recorder.js ...");
		audioContext = new AudioContext();
		audioStream = stream;
		input = audioContext.createMediaStreamSource(stream);
		rec = new Recorder(input, { numChannels: 1 })

		//start the recording process
		rec.record()
		console.log("Recording started");
		setTimeout(function () {
			stopRecording()
		}, 15000)

	}).catch(function (err) {
		brec.disabled = false;
		bstop.disabled = true;
		bpause.disabled = true
	});
}

function pauseRecording() {
	console.log("bpause clicked");
	if (rec.recording) {
		//pause
		rec.stop();
		bpause.innerHTML = "Resume";
	} else {
		//resume
		rec.record()
		bpause.innerHTML = "Pause";

	}
}

function stopRecording() {
	if (!rec.recording) {
		console.log("recording is already stopped")
		return
	}
	console.log("bstop clicked");
	document.getElementById("statuschoices").classList.add("hidden");

	//disable the stop button, enable the record too allow for new recordings
	bstop.disabled = true;
	brec.disabled = false;
	bpause.disabled = true;

	//reset button just in case the recording is stopped while paused
	bpause.innerHTML = "Pause";

	//tell the recorder to stop the recording
	rec.stop();

	//stop microphone access
	audioStream.getAudioTracks()[0].stop();

	//create the wav blob and pass it on to createDownloadLink
	rec.exportWAV(createDownloadLink);
}

async function pollresult(resultjson, counter) {
	counter += 1;
	pngresult = resultjson.pngresult;
	jsonresult = resultjson.jsonresult;
	let response = await fetch(jsonresult.signedurl)
	if (counter > 60) {
		updatemodaltext("Something went wrong... Please try again", false)
		return
	}
	if (response.status != 200) {
		await new Promise(resolve => setTimeout(resolve, 1000));
		await pollresult(resultjson, counter);
	} else {
		data = await response.json();
		// updatemodaltext(resulttxt + data.Result)
		updatemodaltext(resulttxt)
		updatemodalimage(pngresult.signedurl)
	}
}

function updatemodalimage(url) {
	modalimage = document.getElementById("modalimage");
	modalimage.innerHTML = "";
	img = document.createElement('img');
	img.src = url
	img.style.cssText = "padding-left: 5%;max-width: 90%;"
	modalimage.appendChild(img);
}

function updatemodaltext(text, flashing = false) {
	modaltext = document.getElementById("modalstatustext")
	if (flashing) {
		modaltext.classList.add("loadingtext");
	} else {
		modaltext.classList.remove("loadingtext");
	}
	modaltext.innerText = text;
}

async function uploadToS3(datablob, originalfilename, status) {
	var body = document.body;
	body.classList.add("showmodal");
	updatemodaltext("Getting presigned key to upload ...", true)
	console.log("Getting presigned s3 URL for upload.");
	var url = lambdaurl + '/upload/' + status;

	var filemetadata = {
		name: originalfilename
	}

	try {
		response = await fetch(url);
		if (response.ok) {
			responsejson = await response.json()
		}
		else {
			updatemodaltext("Error ...", false)
			console.log("Error getting presigned key for upload")
			document.body.classList.remove("showmodal");
			return false
		}

		signedupload = responsejson.signedupload

		const formData = new FormData();
		formData.append("Content-Type", "audio/wav");
		formData.append("x-amz-meta-tag", (JSON.stringify(filemetadata)))
		Object.entries(signedupload.fields).forEach(([k, v]) => {
			formData.append(k, v);
		});
		formData.append("file", datablob);
		updatemodaltext("Uploading to S3 ...", true)
		response = await fetch(
			signedupload.url,
			{
				method: "POST",
				body: formData,
			})

		if (response.status == 204) {
			updatemodaltext("Please wait for result ...", true);
			console.log("File successfully uploaded!");
			pollresult(responsejson, 0);
			// document.body.classList.remove("showmodal");
			return true
		} else {
			console.log("Fail to upload file!")
			document.body.classList.remove("showmodal");
			return false
		}
	}
	catch (err) {
		console.log("Failed to upload"); // This is where you run code if the server returns any errors
		console.log(err);
		return false
	}
}


function createDownloadLink(blob) {

	var url = window.URL.createObjectURL(blob);
	var au = document.createElement('audio');
	var li = document.createElement('li');
	var link = document.createElement('a');

	//name of .wav file to use during upload and download (without extendion)
	var t = new Date().getTime().toString()
	if (document.getElementById("name").value != "") {
		filename = document.getElementById("name").value + "_";
	} else {
		filename = "anon_";
	}
	status = document.querySelector("input[name=status]:checked").value;
	if (demosite == true) {
		status = "demosite"
	}
	filename += status + "_"
	filename += t
	au.controls = true;
	au.src = url;

	//save to disk link
	//link.href = url;
	//link.download = filename+".wav"; //download forces the browser to donwload the file using the  filename
	//link.innerHTML = "Save to disk";

	//add the new audio element to li
	li.appendChild(au);
	li.appendChild(document.createElement('br'));

	//add the filename to the li
	li.appendChild(document.createTextNode(filename + ".wav "))
	li.appendChild(document.createElement('br'));

	//add the save to disk link to li
	li.appendChild(link);

	//upload link
	var upload = document.createElement('button');
	upload.href = "#";
	upload.innerHTML = "Gửi file";
	upload.addEventListener("click", async function (event) {
		uploadurl = event.target;
		parentnode = uploadurl.parentElement;
		parentnode.removeChild(uploadurl)
		sp = document.createElement("span")
		parentnode.appendChild(sp)
		sp.innerHTML = "Please wait..."
		uploaded = await uploadToS3(blob, filename, status)
		if (uploaded) {
			sp.innerHTML = "File đã gửi."
			parentnode.appendChild(sp)
		} else {
			sp.innerHTML = "App bị lỗi. Xin vui lòng thử lại sau."
			parentnode.appendChild(sp)
		}
	})
	li.appendChild(document.createTextNode(" "))//add a space in between
	li.appendChild(upload)//add the upload link to li

	//add the li element to the ol
	records.appendChild(li);
}