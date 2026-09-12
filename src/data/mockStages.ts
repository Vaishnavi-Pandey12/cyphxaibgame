import type { Stage } from "@/types/game";
export const mockStages:Stage[]=[
 {id:1,suit:"♦",name:"FLIGHT 404",subtitle:"THE LAST SEAT",playersStart:20,playersSurvive:15,skills:["LOGIC","OBSERVATION","RISK"],status:"current",background:"cabin"},
 {id:2,suit:"♠",name:"FISHING",subtitle:"SURVIVE THE JACK",playersStart:15,playersSurvive:10,skills:["SURVIVAL","TIMING","RESOURCE MANAGEMENT"],status:"locked",background:"lake"},
 {id:3,suit:"♠",name:"REDLINE",subtitle:"LASER GRID BREACH",playersStart:10,playersSurvive:7,skills:["REFLEX","PATTERN RECOGNITION","LOGIC"],status:"locked",background:"city"},
 {id:4,suit:"♣",name:"SAME PAGE",subtitle:"THE TRUST TEST",playersStart:7,playersSurvive:4,skills:["TRUST","COORDINATION","PSYCHOLOGY"],status:"locked",background:"archive"},
 {id:5,suit:"♥",name:"DEJA VU",subtitle:"MEMORY LEAK CHAMBER",playersStart:4,playersSurvive:1,skills:["MEMORY","DEDUCTION","COMMUNICATION"],status:"locked",background:"memory"}
];
