package main

import (
	"sync"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type Room struct {
	ID      string
	HostID  string
	Players map[string]*Player
	mu      sync.RWMutex
}

type RoomManager struct {
	rooms map[string]*Room
	mu    sync.RWMutex
}

func NewRoomManager() *RoomManager {
	return &RoomManager{
		rooms: make(map[string]*Room),
	}
}

func (rm *RoomManager) CreateRoom(hostName string, hostConn *websocket.Conn) (*Room, string) {
	rm.mu.Lock()
	defer rm.mu.Unlock()

	roomID := generateRoomID()
	hostID := uuid.New().String()

	room := &Room{
		ID:     roomID,
		HostID: hostID,
		Players: map[string]*Player{
			hostID: {
				ID:     hostID,
				Name:   hostName,
				Conn:   hostConn,
				IsHost: true,
			},
		},
	}

	rm.rooms[roomID] = room
	return room, hostID
}

func (rm *RoomManager) JoinRoom(roomID, playerName string, conn *websocket.Conn) (*Room, *Player, error) {
	rm.mu.Lock()
	defer rm.mu.Unlock()

	room, exists := rm.rooms[roomID]
	if !exists {
		return nil, nil, ErrRoomNotFound
	}

	room.mu.Lock()
	defer room.mu.Unlock()

	if len(room.Players) >= 5 {
		return nil, nil, ErrRoomFull
	}

	playerID := uuid.New().String()
	player := &Player{
		ID:     playerID,
		Name:   playerName,
		Conn:   conn,
		IsHost: false,
	}

	room.Players[playerID] = player
	return room, player, nil
}

func (rm *RoomManager) LeaveRoom(roomID, playerID string) {
	rm.mu.RLock()
	room, exists := rm.rooms[roomID]
	rm.mu.RUnlock()

	if !exists {
		return
	}

	room.mu.Lock()
	delete(room.Players, playerID)
	remaining := len(room.Players)
	room.mu.Unlock()

	if remaining == 0 {
		rm.mu.Lock()
		delete(rm.rooms, roomID)
		rm.mu.Unlock()
	}
}

func (rm *RoomManager) GetRoom(roomID string) (*Room, bool) {
	rm.mu.RLock()
	defer rm.mu.RUnlock()

	room, exists := rm.rooms[roomID]
	return room, exists
}

func (r *Room) GetPlayer(playerID string) (*Player, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	player, exists := r.Players[playerID]
	return player, exists
}

func (r *Room) Broadcast(senderID string, msg Message) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for id, player := range r.Players {
		if id != senderID {
			player.Conn.WriteJSON(msg)
		}
	}
}

func (r *Room) SendTo(playerID string, msg Message) error {
	r.mu.RLock()
	player, exists := r.Players[playerID]
	r.mu.RUnlock()

	if !exists {
		return ErrPlayerNotFound
	}

	return player.Conn.WriteJSON(msg)
}

func (r *Room) PlayerList() []map[string]string {
	r.mu.RLock()
	defer r.mu.RUnlock()

	list := make([]map[string]string, 0, len(r.Players))
	for id, p := range r.Players {
		list = append(list, map[string]string{
			"id":   id,
			"name": p.Name,
		})
	}
	return list
}

func generateRoomID() string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, 6)
	for i := range b {
		b[i] = chars[uuid.New().ID()%36]
	}
	return string(b)
}

type GameError string

func (e GameError) Error() string { return string(e) }

const (
	ErrRoomNotFound   GameError = "room not found"
	ErrRoomFull       GameError = "room is full"
	ErrPlayerNotFound GameError = "player not found"
)
