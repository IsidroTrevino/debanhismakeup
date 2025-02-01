'use client';

import { Client, Storage, Databases, ID, Account } from 'appwrite';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogFooter, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrashIcon } from 'lucide-react';

export default function Home() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);


  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

  const databases = new Databases(client);
  const storage = new Storage(client);
  const account = new Account(client);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const session = await account.get();
      setUser(session);
    } catch (error) {
      console.error('Not logged in');
    }
  };

  const login = async () => {
    try {
      await account.createEmailPasswordSession(
        'debanhimedina2005@gmail.com',
        'Debanhi123'
      );
      await checkUser();
      console.log('Login successful');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate date
    const correctDate = '2024-05-03';
    if (date !== correctDate) {
      setError('MAL GEI');
      return;
    }
    e.preventDefault();
      
    if (!user) {
      await login();
    }
      
    try {
      // Upload file
      const fileUpload = await storage.createFile(
        process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!,
        ID.unique(),
        file!
      );
  
      const document = await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID!,
        ID.unique(),
        {
          title: title,
          link: link,
          imageId: fileUpload.$id
        }
      );

      await fetchProducts();
  
      console.log('Document created:', document);
  
      setTitle('');
      setLink('');
      setFile(null);
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating document:', error);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLink(e.target.value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);
  
  const fetchProducts = async () => {
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID!
      );
      setProducts(response.documents);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const deleteProduct = async (productId: string, imageId: string) => {
    try {
      await storage.deleteFile(
        process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!,
        imageId
      );
      
      await databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID!,
        productId
      );
  
      await fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  return (
    <div className='w-[1200px] mx-auto p-10'>
      <Button className='flex ' onClick={() => setIsDialogOpen(true)}>Agregar</Button>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agrega tu productito!!!</DialogTitle>
            <DialogDescription>Agrega tu productito a tu whishlist chiquita preciosa hermosa</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Nombre del producto</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={handleTitleChange}
                  placeholder="Nombresito"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="link">Link del producto</Label>
                <Input
                  id="link"
                  value={link}
                  onChange={handleLinkChange}
                  placeholder="https://..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="image">Sube tu imagensitaaaa!!!</Label>
                <Input
                  id="image"
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Fecha de nuestro casamiento oficial (PARA COMPROBAR QUE SI SOS VOS)</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={handleDateChange}
                required
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
            <DialogFooter className='pt-4'>
              <Button type="submit">Pon tu productito!!!</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <div className="max-w-[1200px] mx-auto mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
          {products.map((product) => (
            <div 
              key={product.$id} 
              className="border rounded-lg overflow-hidden shadow-lg bg-white"
            >
              <img
                src={`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID}/files/${product.imageId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`}
                alt={product.title}
                className="w-full aspect-square object-cover"
              />
              <div className="p-4 flex justify-between items-center">
                <h3 className="text-xl font-bold mb-2">{product.title}</h3>
                <div className="flex gap-4 items-center">
                  <a 
                    href={product.productURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      window.open(product.productURL, '_blank');
                    }}
                  >
                    Ver Producto
                  </a>
                  <button
                    onClick={() => deleteProduct(product.$id, product.imageId)}
                    className="p-2 text-red-500 hover:text-red-700 transition-colors"
                  >
                    <TrashIcon size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}