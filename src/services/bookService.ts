import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  deleteDoc, 
  updateDoc, 
  query, 
  where,
  getDoc,
} from "firebase/firestore";

export interface Book {
  id?: string;
  title: string;
  author: string;
  coverUrl: string;
  genres?: string[];
  pageCount?: number;
  synopsis?: string;
  status: "Lido" | "Não Lido" | "Lendo";
  rating?: number;
  userId: string;
  notes?: string;
  language?: string;
  favorite?: boolean;
}

export async function fetchBooksByUserId(userId: string): Promise<Book[]> {
  try {
    const booksQuery = query(collection(db, "books"), where("userId", "==", userId));
    const querySnapshot = await getDocs(booksQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<Book, "id">
    }));
  } catch (error) {
    console.error("Error fetching books:", error);
    throw error;
  }
}

export async function addBook(bookData: Omit<Book, "id">): Promise<string> {
  try {
    // Remove undefined fields before adding to Firestore
    const cleanedData = Object.entries(bookData).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
    
    const docRef = await addDoc(collection(db, "books"), cleanedData);
    return docRef.id;
  } catch (error) {
    console.error("Error adding book:", error);
    throw error;
  }
}

export async function updateBook(id: string, bookData: Partial<Book>): Promise<void> {
  try {
    // Remove undefined fields before updating in Firestore
    const cleanedData = Object.entries(bookData).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
    
    const bookRef = doc(db, "books", id);
    await updateDoc(bookRef, cleanedData);
  } catch (error) {
    console.error("Error updating book:", error);
    throw error;
  }
}

export async function deleteBook(id: string): Promise<void> {
  try {
    const bookRef = doc(db, "books", id);
    await deleteDoc(bookRef);
  } catch (error) {
    console.error("Error deleting book:", error);
    throw error;
  }
}

export async function getBookById(id: string): Promise<Book | null> {
  try {
    const bookRef = doc(db, "books", id);
    const bookSnap = await getDoc(bookRef);
    
    if (bookSnap.exists()) {
      return {
        id: bookSnap.id,
        ...bookSnap.data() as Omit<Book, "id">
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error getting book:", error);
    throw error;
  }
}