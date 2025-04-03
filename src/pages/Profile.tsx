
import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Navigate } from 'react-router-dom';
import { Camera } from 'lucide-react';

const Profile = () => {
  const { currentUser, updateUserProfile, loading } = useAuth();
  const [nickname, setNickname] = useState(currentUser?.displayName || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse text-purple-500">Carregando...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result as string);
      };
      fileReader.readAsDataURL(file);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    try {
      await updateUserProfile(nickname, selectedFile);
      // Reset selected file after successful update
      setSelectedFile(null);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Seu Perfil</CardTitle>
          <CardDescription>Atualize suas informações de perfil</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div 
                className="relative cursor-pointer group" 
                onClick={handleAvatarClick}
              >
                <Avatar className="h-32 w-32 border-4 border-purple-300">
                  <AvatarImage src={previewUrl || currentUser.photoURL || undefined} />
                  <AvatarFallback className="text-3xl">
                    {(nickname || currentUser.displayName || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white" />
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <p className="text-sm text-muted-foreground">
                Clique na imagem para mudar a foto
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nickname">Nome de Exibição</Label>
              <Input 
                id="nickname" 
                value={nickname} 
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Como deseja ser chamado?"
              />
            </div>
            
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input 
                value={currentUser.email || ''} 
                disabled 
                className="bg-muted/50"
              />
              <p className="text-xs text-muted-foreground mt-1">
                O e-mail não pode ser alterado
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSaving} className="w-full">
              {isSaving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Profile;
