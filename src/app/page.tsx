'use client';

import { Client, Storage, Databases, ID, Query } from 'appwrite';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogFooter, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader, TrashIcon, MoreVertical } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


interface Product {
  $id: string;
  title: string;
  productURL: string;
  imageId: string;
  priority: 'Alta' | 'no tanta' | 'poquillo';
  comprado?: boolean;
}

type PriorityFilter = 'all' | 'Alta' | 'no tanta' | 'poquillo';


const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

const databases = new Databases(client);
const storage = new Storage(client);

export default function Home() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [priority, setPriority] = useState<'Alta' | 'no tanta' | 'poquillo'>('Alta');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [comprado, setComprado] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');


  const [date, setDate] = useState('');
  const [error, setError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);

    try {
      const correctDate = '2024-05-03';
      if (date !== correctDate) {
        setError('MAL GEI');
        setIsSubmitting(false);
        return;
      }

      if (!file) {
        setError('Por favor selecciona una imagen');
        setIsSubmitting(false);
        return;
      }

      const fileUpload = await storage.createFile(
        process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!,
        ID.unique(),
        file
      );
  
      await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID!,
        ID.unique(),
        {
          title,
          link,
          imageId: fileUpload.$id,
          priority,
          comprado: false,
        }
      );

      await fetchProducts();
  
      console.log('Document created:', document);
  
      setTitle('');
      setLink('');
      setFile(null);
      setDate('');
      setError('');
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating document:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
  
    try {
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID!,
        editingProduct!.$id,
        {
          title,
          link,
          priority,
          comprado,
        }
      );
  
      setIsEditDialogOpen(false);
      setEditingProduct(null);
      await fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setTitle(product.title);
    setLink(product.productURL);
    setPriority(product.priority);
    setComprado(product.comprado!);
    setIsEditDialogOpen(true);
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
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID!,
        [
          Query.equal('comprado',false)
        ],
      );

      setProducts(response.documents.map(doc => ({
        $id: doc.$id,
        title: doc.title as string,
        productURL: doc.link as string,
        imageId: doc.imageId as string,
        priority: doc.priority as 'Alta' | 'no tanta' | 'poquillo',
        comprado: doc.comprado as boolean,
      })));
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const filteredProducts = products.filter(product => {
    if (priorityFilter === 'all') return true;
    return product.priority === priorityFilter;
  });

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
    <div className='w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 pt-6'>
      <div className='flex justify-between items-center'>
        <Button className='w-full sm:w-auto mb-6' onClick={() => setIsDialogOpen(true)}>
          Agregar
        </Button>
        <Button onClick={() => router.push('/comprados')}>Ver comprados!!!</Button>
      </div>
      <div className="mb-6">
          <Select value={priorityFilter} onValueChange={(value: PriorityFilter) => setPriorityFilter(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las prioridades</SelectItem>
              <SelectItem value="Alta">Alta</SelectItem>
              <SelectItem value="no tanta">No tanta</SelectItem>
              <SelectItem value="poquillo">Poquillo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="w-[95vw] max-w-[500px] p-4 sm:p-6">
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
              <div className="grid gap-2">
                <Label htmlFor="priority">Prioridad</Label>
                <select 
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'Alta' | 'no tanta' | 'poquillo')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="Alta">Alta</option>
                  <option value="no tanta">No tanta</option>
                  <option value="poquillo">Poquillo</option>
                </select>
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
              <Button type="submit">
              {isSubmitting ? (
                <Loader size={20} className='animate-spin text-muted-foreground'/>
              ) : 'Pon tu productito!!!'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DialogContent className="w-[95vw] max-w-[500px] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Editar Producto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleEdit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Nombre del producto</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={handleTitleChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-link">Link del producto</Label>
              <Input
                id="edit-link"
                value={link}
                onChange={handleLinkChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-priority">Prioridad</Label>
              <select 
                id="edit-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'Alta' | 'no tanta' | 'poquillo')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="Alta">Alta</option>
                <option value="no tanta">No tanta</option>
                <option value="poquillo">Poquillo</option>
              </select>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center space-x-2">
              <Switch 
                  id="comprado-bool" 
                  checked={comprado} 
                  onCheckedChange={setComprado}
                />
                <Label htmlFor="comprado-bool">Comprado</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader className="animate-spin" />
              ) : (
                'Guardar cambios'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
      <div className="max-w-[1200px] mx-auto mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        {filteredProducts.map((product) => (
          <div 
            key={product.$id} 
            className="border rounded-lg overflow-hidden shadow-lg bg-white"
          >
            <img
              src={`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID}/files/${product.imageId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`}
              alt={product.title}
              className="w-full aspect-square object-cover"
            />
            <div className="p-4">
              <h3 className="text-lg sm:text-xl font-bold mb-2">{product.title}</h3>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <span className={`px-2 py-1 rounded-full text-sm inline-block ${
                  product.priority === 'Alta' 
                    ? 'bg-red-100 text-red-800' 
                    : product.priority === 'no tanta'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {product.priority}
                </span>
                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                  <a 
                    href={product.productURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm sm:text-base px-3 py-1.5 sm:px-4 sm:py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors"
                  >
                    Ver Producto
                  </a>
                  <button
                    onClick={() => openEditDialog(product)}
                    className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-700"
                  >
                    <MoreVertical size={18} />
                  </button>
                  <button
                    onClick={() => deleteProduct(product.$id, product.imageId)}
                    className="p-1.5 sm:p-2 text-red-500 hover:text-red-700"
                  >
                    <TrashIcon size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}