import Client from "./client";
import { EventEmitter } from "events";
import {
    WhatsAppServerMsg, DataMsgTypes, DataPresence, PreemptMessage,
    BinAttrChat, BinAttrUser, BinAttrResponse, BinNode
} from "./interfaces";
import { Color } from "../utils";
import * as fs from "fs";
import "../whatsapp_pb"
import { handleActionMsg } from "./parser";
import Wid from "./wid/wid";


class WhatsApp extends EventEmitter {
    client: Client
    chats: BinAttrChat[] = []
    contacts: BinAttrUser[] = []

    constructor(authFile = '.auth') {
        super()
        this.client = new Client(authFile, this)
        const preemptHandle = parsed => this.binaryHandle(parsed)
        this.on('preempt', preemptHandle)
        this.on('initialized', () => this.off('preempt', preemptHandle))
    }

    connect() {
        return this.client.connect()
    }

    close() {
        this.client.ws.send('goodbye,,["admin","Conn","disconnect"]')
        this.client.close()
    }

    send(wid:Wid, message){
        /*
        [
            "action",
            {
                "type": "relay",
                "epoch": "5"
            },
            [
                [
                "message",
                null,
                ArrayBuffer of Message or WebMessage,
                ]
            ]
            ]
         */
    }
    // loadMessage
    /*
    [
  "query",
  {
    "type": "message",
    "kind": "before",
    "jid": "628997026464@c.us",
    "count": "50",
    "index": "3EB01C2454884CAA32CC",
    "owner": "false",
    "epoch": "2"
  },
  null
]
    */

    binaryHandle(parsed: BinNode) {
        if ('undefined' == typeof this[`binaryHandle_${parsed[0]}`]) {
            L(Color.r('Missing binaryHandler'), parsed[0])
        } else {
            return this[`binaryHandle_${parsed.shift()}`](...parsed)
        }
    }

    binaryHandle_response(attr: BinAttrResponse, childs) {
        if (Array.isArray(childs)) {
            childs.forEach(child => this.binaryHandle(child))
        } else {
            L(Color.r("binaryHandle_response: invalid child"), childs)
        }
    }

    binaryHandle_user(attr: BinAttrUser, childs) {
        this.contacts.push(attr)
    }

    binaryHandle_chat(attr: BinAttrChat, childs) {
        this.chats.push(attr)
    }

    binaryHandle_action(attr: BinAttrChat, childs) {
        handleActionMsg(attr, childs)
    }

    // binaryHandle_message(attr: BinAttrChat, data) {
    //     //const obj: any = proto.proto.Message.deserializeBinary(data).toObject()

    //     //L('message', attr, data)
    // }

}

declare interface WhatsApp extends NodeJS.EventEmitter {
    /**
     * its server command, have kind param,
     * if kind 'replaced' then replaced event also emitted
     */
    on(event: string, listener: (...args: any[]) => void): this;
    on(event: 'open', listener: () => void): this;
    /** After login and received some initial data from server */
    on(event: 'initialized', listener: () => void): this;
    on(event: 'disconnect', listener: (kind: 'replaced') => void): this;
    /** Login in another web.whatsapp */
    on(event: 'replaced', listener: () => void): this;
    /** WebSocker error */
    on(event: 'error', listener: (this: WebSocket, err: Error) => void): this;
    /** WebSocket Closed */
    on(event: 'close', listener: (this: WebSocket, code: number, reason: string) => void): this;
    /** Got message */
    //on(event: 'message', listener: (tag: string, data: Buffer | string) => void): this;
    /** Got server message, 's' prefixed eg s1, s2, s3 */
    on(event: 'server-message', listener: (cmd: WhatsAppServerMsg, data: Array<any> | Object) => void): this;
    /** On preempt chats received */
    on(event: 'chats-loaded', listener: (chats: BinAttrChat[]) => void): this;
    /** '!' prefixed */
    on(event: 'timeskew', listener: (ts: number, message: null | string | Buffer) => void): this;
    on(event: 'preempt', listener: (data: PreemptMessage) => void): this;
    on(event: 'Stream', listener: (data: any) => void): this;
    on(event: 'Props', listener: (data: any) => void): this;
    on(event: 'Blocklist', listener: (data: any) => void): this;
    on(event: 'Presence', listener: (data: DataPresence) => void): this;
    on(event: 'Msg', listener: (data: DataMsgTypes) => void): this;
}

export default WhatsApp