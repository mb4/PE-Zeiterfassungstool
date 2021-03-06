<?php

$to = 'receiver@example.com, receiver2@example.com';

$subject = 'TimeTrackTool - der einfache Weg, deine Arbeitszeit zu erfassen';

$headers = "From: sender@example.com\r\n";
$headers .= "Reply-To: sender@example.com\r\n";
//$headers .= "CC: copy@example.com\r\n";
//$headers .= "BCC: blindcopy@example.com\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/html; charset=UTF-8\r\n";


$message = '<!DOCTYPE html>
<html>
<head>
<title>TimeTrackTool - der einfache Weg, deine Arbeitszeit zu erfassen</title>
<meta charset="utf-8">
<style>
    body {
        margin: 0;
        background-color: #eee;
        color: #001934;
        font: 400 16px "Myriad Pro","Helvetica Neue", Helvetica, Arial, sans-serif;
    }
    
    .ttt-wrapper {
        max-width: 780px;
        padding: 10px;
		margin: 0 auto;
    }
    
    .ttt-logo,
    .ttt-screen {
        display: block;
        margin: 2em auto;
    }
    .ttt-screen {
        width: 80%;
        max-width: 600px;
        box-shadow: 0 0 .5em #ccc;
    }
    
    a {
        color: #0f82ff;
        text-decoration: none;
    }
    a img {
    	border: 0 !important;
    }
    
    a:hover {
        text-decoration: underline;
    }
    
    h1, h2, h3 {
        margin: 1em 0;
        font-weight: 300;
        color: #555;
    }
    h1 {
        margin-bottom: 2em;
        text-align: center;
        font-size: 2em;
        color: #001934;
    }
    h2 {
        max-width: 400px;
        margin: 1em auto;
        font-size: 1.6em;
        text-align: center;
    }
    h3 {
        font-size: 1.3em;
        transition: color .4s ease 0s;
    }
    
    h1 span {
        display: block;
        width: 70%;
        min-width: 400px;
        margin: .5em auto;
        color: #555;
        font-size: .7em;
    }
    
    .ttt-third {
        display: inline-block;
        vertical-align: top;
        width: 29%;
        padding: 1% .5em;
        border-top: 1px solid #aaa;
        background-color: transparent;
    }
    .ttt-third:hover h3 {
        color: #001934;
    }
    .ttt-third img {
        display: block;
        margin: 1em auto;
    }

    
    .ttt-button {
        display: inline-block;
        margin: 1em;
        padding: .5em;
        border-radius: .5em;
        background-color: #0f82ff;
        color: #fff;
        text-decoration: none;
        font-size: 18px;
        transition: background-color .4s ease 0s;
    }
    .ttt-button:hover {
        text-decoration: none;
    }
    .ttt-button:hover {
        background-color: #001934;
    }
	
	.ttt-preheader {
		display: none;
		width: 100%;
		text-align: center;
		font-size: .8em;
	}
    
    .ttt-footer {
        border-top: 1px solid #aaa;
        margin: 1em;
        padding: 1em;
        font-size: .8em;
        text-align: center;
    }

</style>
</head>
<body>

<div class="ttt-wrapper">
	<div class="ttt-preheader"><a href="http://mb4.github.io/PE-Zeiterfassungstool/mail/ttt_mail.html">Hier klicken f�r eine Online-Ansicht</a>, falls diese Mail nicht korrekt angezeigt wird.</div>
    <a href="http://mb4.github.io/PE-Zeiterfassungstool"><img class="ttt-logo" src="http://mb4.github.io/PE-Zeiterfassungstool/mail/ttt_logo_full_bright.png" width="302" height="45">
    <img class="ttt-screen" src="http://mb4.github.io/PE-Zeiterfassungstool/mail/ttt_screen.jpg"></a>

    <h1>
        Wissen, wie viel du gearbeitet hast.
        <span>Mit <strong>TimeTrackTool</strong> wird die Erfassung deiner Arbeitszeit so einfach wie nie zuvor &ndash; angepasst an deine Bed�rfnisse als dualer Student.</span>
    </h1>
    
    
    <div class="ttt-third">
        <img src="http://mb4.github.io/PE-Zeiterfassungstool/mail/ttt_project.png" width="60" height="60">
        <h3>Lege Praxisphasen und Projekte an.</h3>
        <p>Erfasse deine Arbeitszeit genau dort, wo du sie einsetzt &ndash; ob PE oder Kundenprojekt.</p>
    </div><div class="ttt-third">
        <img src="http://mb4.github.io/PE-Zeiterfassungstool/mail/ttt_week.png" width="60" height="60">
        <h3>Automatisch erstellte Wochen�bersichten.</h3>
        <p>Behalte mit der Wochenansicht den �berblick �ber deine zu leistende Arbeitszeit.</p>
    </div><div class="ttt-third">
        <img src="http://mb4.github.io/PE-Zeiterfassungstool/mail/ttt_day.png" width="60" height="60">
        <h3>Volle Kontrolle �ber deinen Arbeitstag.</h3>
        <p>Betrachte die erfassten Zeiten f�r jeden Tag. Bearbeite bestehende Eintr�ge, oder f�ge manuell neue hinzu.</p>
    </div>
    
    <h2>Probiere es gleich aus und speichere es dir als Lesezeichen.
    <a href="http://mb4.github.io/PE-Zeiterfassungstool" class="ttt-button">TimeTrackTool �ffnen</a>
    </h2>
    
    <p class="ttt-footer">Projekt �ffentlich verf�gbar auf <a href="http://github.com/mb4/PE-Zeiterfassungstool">Github</a> </p>
</div>
</body>
</html>';

mail($to, $subject, $message, $headers);

?>