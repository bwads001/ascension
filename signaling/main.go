package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func main() {
	port := getEnv("PORT", "8080")
	manager := NewRoomManager()

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("WebSocket upgrade error: %v", err)
			return
		}
		defer conn.Close()

		handleConnection(conn, manager)
	})

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	log.Printf("Signaling server starting on :%s", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}

func handleConnection(conn *websocket.Conn, manager *RoomManager) {
	var playerID string
	var roomID string

	for {
		_, raw, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("Read error: %v", err)
			}
			if roomID != "" && playerID != "" {
				manager.LeaveRoom(roomID, playerID)
				if room, _ := manager.GetRoom(roomID); room != nil {
					room.Broadcast(playerID, Message{
						Type:     MessageTypePlayerLeft,
						PlayerID: playerID,
					})
				}
			}
			return
		}

		var msg Message
		if err := json.Unmarshal(raw, &msg); err != nil {
			conn.WriteJSON(Message{Type: MessageTypeError, Error: "invalid message format"})
			continue
		}

		switch msg.Type {
		case MessageTypeCreateRoom:
			room, id := manager.CreateRoom(msg.PlayerName, conn)
			playerID = id
			roomID = room.ID
			conn.WriteJSON(Message{
				Type:     MessageTypeRoomCreated,
				RoomID:   room.ID,
				PlayerID: id,
			})

		case MessageTypeJoinRoom:
			room, player, err := manager.JoinRoom(msg.RoomID, msg.PlayerName, conn)
			if err != nil {
				conn.WriteJSON(Message{Type: MessageTypeError, Error: err.Error()})
				continue
			}
			playerID = player.ID
			roomID = room.ID
			conn.WriteJSON(Message{
				Type:     MessageTypeRoomJoined,
				RoomID:   room.ID,
				PlayerID: player.ID,
				Payload:  room.PlayerList(),
			})
			room.Broadcast(player.ID, Message{
				Type:       MessageTypePlayerJoined,
				PlayerID:   player.ID,
				PlayerName: player.Name,
			})

		case MessageTypeLeaveRoom:
			if roomID != "" && playerID != "" {
				manager.LeaveRoom(roomID, playerID)
				if room, _ := manager.GetRoom(roomID); room != nil {
					room.Broadcast(playerID, Message{
						Type:     MessageTypePlayerLeft,
						PlayerID: playerID,
					})
				}
				roomID = ""
				playerID = ""
			}

		case MessageTypeOffer, MessageTypeAnswer, MessageTypeIceCandidate:
			if roomID == "" {
				conn.WriteJSON(Message{Type: MessageTypeError, Error: "not in a room"})
				continue
			}
			room, exists := manager.GetRoom(roomID)
			if !exists {
				conn.WriteJSON(Message{Type: MessageTypeError, Error: "room not found"})
				continue
			}
			if msg.PlayerID != "" {
				room.SendTo(msg.PlayerID, Message{
					Type:     msg.Type,
					PlayerID: playerID,
					Payload:  msg.Payload,
				})
			} else {
				room.Broadcast(playerID, Message{
					Type:     msg.Type,
					PlayerID: playerID,
					Payload:  msg.Payload,
				})
			}
		}
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
