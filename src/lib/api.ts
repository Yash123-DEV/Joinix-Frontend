


export const createRoom = async ( userId: string ) => {
    const res = await fetch("https://joinix-backend-1.onrender.com/api/rooms/create", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({userId}),
    });

    if (!res.ok) {
    const error = await res.json();
    throw new Error(error?.error || "Failed to create room");
   }

   return res.json();

}