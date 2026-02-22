package main

import "github.com/gorilla/websocket"

type MessageType string

const (
	MessageTypeCreateRoom   MessageType = "create_room"
	MessageTypeJoinRoom     MessageType = "join_room"
	MessageTypeLeaveRoom    MessageType = "leave_room"
	MessageTypeRoomCreated  MessageType = "room_created"
	MessageTypeRoomJoined   MessageType = "room_joined"
	MessageTypeError        MessageType = "error"
	MessageTypePlayerJoined MessageType = "player_joined"
	MessageTypePlayerLeft   MessageType = "player_left"
	MessageTypeOffer        MessageType = "offer"
	MessageTypeAnswer       MessageType = "answer"
	MessageTypeIceCandidate MessageType = "ice_candidate"
)

type Message struct {
	Type       MessageType `json:"type"`
	RoomID     string      `json:"roomId,omitempty"`
	PlayerID   string      `json:"playerId,omitempty"`
	PlayerName string      `json:"playerName,omitempty"`
	Payload    any         `json:"payload,omitempty"`
	Error      string      `json:"error,omitempty"`
}

type Player struct {
	ID     string
	Name   string
	Conn   *websocket.Conn
	IsHost bool
}
