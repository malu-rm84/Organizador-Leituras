import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider, storage } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "@/components/ui/use-toast";

interface AuthContextProps {
  currentUser: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (nickname: string, photoFile: File | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user exists in firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      
      // If user doesn't exist, create a new document
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName || "Usuário",
          photoURL: user.photoURL,
          createdAt: new Date(),
        });
      }
      
      toast({
        title: "Login bem sucedido",
        description: "Você foi conectado com sucesso!",
      });
    } catch (error: any) {
      console.error("Error signing in with Google", error);
      
      let errorMessage = "Ocorreu um erro ao tentar fazer login com o Google.";
      
      // Mensagens de erro mais específicas
      if (error.code === 'auth/unauthorized-domain') {
        errorMessage = "Este domínio não está autorizado para autenticação. Se estiver em desenvolvimento local, configure os emuladores do Firebase ou adicione o domínio ao console do Firebase.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "O popup de login foi fechado antes da autenticação ser concluída.";
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = "A operação de login foi cancelada.";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "O popup de login foi bloqueado pelo navegador.";
      }
      
      toast({
        title: "Erro ao fazer login",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logout bem sucedido",
        description: "Você foi desconectado com sucesso!",
      });
    } catch (error) {
      console.error("Error signing out", error);
      toast({
        title: "Erro ao fazer logout",
        description: "Ocorreu um erro ao tentar fazer logout.",
        variant: "destructive",
      });
    }
  };

  const updateUserProfile = async (nickname: string, photoFile: File | null) => {
    if (!currentUser) return;

    try {
      let photoURL = currentUser.photoURL;

      if (photoFile) {
        const storageRef = ref(storage, `profile_pictures/${currentUser.uid}`);
        await uploadBytes(storageRef, photoFile);
        photoURL = await getDownloadURL(storageRef);
      }

      await updateProfile(currentUser, {
        displayName: nickname,
        photoURL: photoURL,
      });

      // Update in Firestore
      const userRef = doc(db, "users", currentUser.uid);
      await setDoc(
        userRef,
        {
          displayName: nickname,
          photoURL: photoURL,
        },
        { merge: true }
      );

      toast({
        title: "Perfil atualizado",
        description: "Seu perfil foi atualizado com sucesso!",
      });
    } catch (error) {
      console.error("Error updating profile", error);
      toast({
        title: "Erro ao atualizar perfil",
        description: "Ocorreu um erro ao tentar atualizar seu perfil.",
        variant: "destructive",
      });
    }
  };

  const value = {
    currentUser,
    loading,
    signInWithGoogle,
    logout,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
