"use client";

import React, { useState, useEffect, useCallback } from "react";
import { format, addDays, differenceInMinutes } from "date-fns";

interface Note {
  id: string;
  title: string;
  details: string;
  starttime: string; // ISO string
  endtime: string;   // ISO string
  userid: string;    // User ID
}

const NotesByDay: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const loggedInUser = "00000000-0000-0000-0000-000000000000"; // Mock User ID

  // Generate hourly time slots
  const timeSlots = Array.from({ length: 24 }, (_, i) =>
    `${i.toString().padStart(2, "0")}:00`
  );

  const fetchNotes = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/notes?date=${format(selectedDate, "yyyy-MM-dd")}`
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch notes");
      }
      const data = await response.json();
      setNotes(data);
    } catch (err) {
      console.error("Error fetching notes:", err instanceof Error ? err.message : err);
    }
  }, [selectedDate]);

  const handleSaveNote = async (note: Partial<Note>) => {
    try {
      const method = note.id ? "PUT" : "POST";
      const endpoint = note.id ? `/api/notes/${note.id}` : `/api/notes`;
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(note),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save note");
      }
      fetchNotes();
      setSelectedNote(null);
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  const handleDeleteNote = async (noteId: string | number) => {
    try {
      const id = typeof noteId === "string" ? parseInt(noteId, 10) : noteId;
      const response = await fetch(`/api/notes/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete note");
      }
      fetchNotes();
      setSelectedNote(null);
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const handleSlotClick = (timeSlot: string) => {
    const starttime = `${format(selectedDate, "yyyy-MM-dd")}T${timeSlot}:00Z`;
    const endtime = `${format(selectedDate, "yyyy-MM-dd")}T${timeSlot}:59Z`;
    setSelectedNote({
      id: "",
      title: "",
      details: "",
      starttime,
      endtime,
      userid: loggedInUser,
    });
  };

  const handleNoteClick = (note: Note) => {
    if (note.userid !== loggedInUser) {
      alert("You can only edit or delete your own notes.");
      return;
    }
    setSelectedNote(note);
  };

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const navigateDate = (direction: "prev" | "next") => {
    setSelectedDate((prev) =>
      direction === "prev" ? addDays(prev, -1) : addDays(prev, 1)
    );
  };

  const calculateTopOffset = (starttime: string) => {
    const start = new Date(starttime);
    const hours = start.getHours();
    const minutes = start.getMinutes();
    return (hours * 60 + minutes) * (4 / 60); // 4rem height per hour
  };

  const calculateHeight = (starttime: string, endtime: string) => {
    const start = new Date(starttime);
    const end = new Date(endtime);
    return (differenceInMinutes(end, start) * 4) / 60; // 4rem height per hour
  };

  return (
    <div className="flex flex-col items-center p-6 bg-gray-900 min-h-screen text-white">
      <h1 className="text-4xl font-bold mb-6">Notes By Day</h1>

      {/* Date Navigation */}
      <div className="flex items-center justify-between mb-6 w-full max-w-md">
        <button
          onClick={() => navigateDate("prev")}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md"
        >
          Previous Day
        </button>
        <h2 className="text-xl font-bold">
          {format(selectedDate, "EEEE, MMMM d, yyyy")}
        </h2>
        <button
          onClick={() => navigateDate("next")}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md"
        >
          Next Day
        </button>
      </div>

      {/* Calendar */}
      <div className="relative w-full max-w-4xl">
        <div className="relative grid grid-cols-6 gap-0">
          {timeSlots.map((timeSlot) => (
            <React.Fragment key={timeSlot}>
              <div
                className="flex items-center col-span-2 justify-center border border-gray-700 bg-gray-800 text-gray-300 p-2"
                style={{ height: "4rem" }}
              >
                {timeSlot}
              </div>
              <div
                className="col-span-4 border border-gray-700 bg-gray-900 text-gray-300 p-2 relative"
                style={{ height: "4rem" }}
                onClick={() => handleSlotClick(timeSlot)}
              ></div>
            </React.Fragment>
          ))}
        </div>

        {/* Render Notes */}
        {notes.map((note) => (
          <div
            key={note.id}
            className="absolute bg-green-700 text-white p-2 rounded-md shadow-md"
            style={{
              top: `${calculateTopOffset(note.starttime)}rem`,
              height: `${calculateHeight(note.starttime, note.endtime)}rem`,
              left: "33.33333%",
              width: "66.66666%",
            }}
            onClick={() => handleNoteClick(note)}
          >
            <p className="font-bold">{note.title}</p>
            <p className="text-sm">{note.details}</p>
          </div>
        ))}
      </div>

      {/* Booking Form Modal */}
      {selectedNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-black">
              {selectedNote.id ? "Edit Note" : "New Note"}
            </h2>
            <label className="block mb-2 font-medium text-black">Title</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md mb-4"
              value={selectedNote.title}
              onChange={(e) =>
                setSelectedNote((prev) =>
                  prev ? { ...prev, title: e.target.value } : null
                )
              }
            />
            <label className="block mb-2 font-medium text-black">Details</label>
            <textarea
              className="w-full p-2 border border-gray-300 rounded-md mb-4"
              value={selectedNote.details}
              onChange={(e) =>
                setSelectedNote((prev) =>
                  prev ? { ...prev, details: e.target.value } : null
                )
              }
            />
            <label className="block mb-2 font-medium text-black">Start Time</label>
            <input
              type="datetime-local"
              className="w-full p-2 border border-gray-300 rounded-md mb-4"
              value={selectedNote.starttime.replace("Z", "")}
              onChange={(e) =>
                setSelectedNote((prev) =>
                  prev ? { ...prev, starttime: e.target.value + "Z" } : null
                )
              }
            />
            <label className="block mb-2 font-medium text-black">End Time</label>
            <input
              type="datetime-local"
              className="w-full p-2 border border-gray-300 rounded-md mb-4"
              value={selectedNote.endtime.replace("Z", "")}
              onChange={(e) =>
                setSelectedNote((prev) =>
                  prev ? { ...prev, endtime: e.target.value + "Z" } : null
                )
              }
            />
            <div className="flex justify-between">
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                onClick={() => handleSaveNote(selectedNote)}
              >
                Save
              </button>
              {selectedNote.id && (
                <button
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
                  onClick={() => handleDeleteNote(selectedNote.id)}
                >
                  Delete
                </button>
              )}
              <button
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
                onClick={() => setSelectedNote(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesByDay;
