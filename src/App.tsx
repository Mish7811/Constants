import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle2, Circle, Trash2, Plus, Activity, Brain, Cross, Home, GripVertical } from 'lucide-react';
import { DndContext, DragEndEvent, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import "./index.css";

type Category = 'physical' | 'mental' | 'spiritual' | 'chores';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  category: Category;
  isNew?: boolean;
  isDeleting?: boolean;
}

const defaultTasks: Task[] = [
  { id: '1', text: 'Morning workout', completed: false, category: 'physical' },
  { id: '2', text: 'Meditation', completed: false, category: 'spiritual' },
  { id: '3', text: 'Read for 30 minutes', completed: false, category: 'mental' },
  { id: '4', text: 'Make the bed', completed: false, category: 'chores' },
];

function SortableTask({ task, onToggle, onDelete }: { task: Task; onToggle: () => void; onDelete: () => void }) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getCategoryColor = (category: Category) => {
    switch (category) {
      case 'physical':
        return 'from-rose-500 to-orange-500';
      case 'mental':
        return 'from-blue-500 to-cyan-500';
      case 'spiritual':
        return 'from-purple-500 to-pink-500';
      case 'chores':
        return 'from-emerald-500 to-teal-500';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-4 bg-gray-700 rounded-xl hover:bg-gray-600 transition-all duration-300 ${
        task.isNew ? 'task-enter' : ''
      } ${task.isDeleting ? 'task-exit' : ''}`}
    >
      <div className="flex items-center gap-3 flex-1">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-300 p-1"
        >
          <GripVertical className="w-5 h-5" />
        </button>
        <button
          onClick={onToggle}
          className={`transition-colors duration-200 ${
            task.completed 
              ? `text-${getCategoryColor(task.category).split('-')[1]}-500` 
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          {task.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
        </button>
        <span className={`text-gray-100 ${task.completed ? 'line-through opacity-50' : ''}`}>
          {task.text}
        </span>
      </div>
      {showConfirmDelete ? (
        <div className="flex items-center gap-2">
          <button
            onClick={onDelete}
            className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
          <button
            onClick={() => setShowConfirmDelete(false)}
            className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowConfirmDelete(true)}
          className="text-gray-400 hover:text-red-400 transition-colors duration-200 p-2 rounded-lg hover:bg-gray-500/20"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

function App() {
  // Load tasks from localStorage on initial render
  const [tasks, setTasks] = useState<Task[]>(() => {
    const savedTasks = localStorage.getItem('tasks');
    return savedTasks ? JSON.parse(savedTasks) : defaultTasks;
  });
  
  const [newTask, setNewTask] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('physical');

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks.filter(task => !task.isDeleting)));
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim()) {
      const task: Task = {
        id: Date.now().toString(),
        text: newTask,
        completed: false,
        category: selectedCategory,
        isNew: true,
      };
      setTasks([...tasks, task]);
      setNewTask('');
      
      // Remove the isNew flag after animation
      setTimeout(() => {
        setTasks(current =>
          current.map(t => (t.id === task.id ? { ...t, isNew: false } : t))
        );
      }, 300);
    }
  };

  const toggleTask = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (taskId: string) => {
    setTasks(current =>
      current.map(task =>
        task.id === taskId ? { ...task, isDeleting: true } : task
      )
    );

    setTimeout(() => {
      setTasks(current => current.filter(task => task.id !== taskId));
    }, 300);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setTasks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        const newItems = [...items];
        const [movedItem] = newItems.splice(oldIndex, 1);
        newItems.splice(newIndex, 0, movedItem);
        
        return newItems;
      });
    }
  };

  const getCategoryIcon = (category: Category) => {
    switch (category) {
      case 'physical':
        return <Activity className="w-5 h-5" />;
      case 'mental':
        return <Brain className="w-5 h-5" />;
      case 'spiritual':
        return <Cross className="w-5 h-5" />;
      case 'chores':
        return <Home className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: Category) => {
    switch (category) {
      case 'physical':
        return 'from-rose-500 to-orange-500';
      case 'mental':
        return 'from-blue-500 to-cyan-500';
      case 'spiritual':
        return 'from-purple-500 to-pink-500';
      case 'chores':
        return 'from-emerald-500 to-teal-500';
    }
  };

  const categories: Category[] = ['physical', 'mental', 'spiritual', 'chores'];

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-8 text-center pacifico-regular">
          Daily Constants
        </h1>

        
        {/* Add Task Form */}
        <form onSubmit={addTask} className="mb-8 bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-700">
          <div className="flex flex-wrap gap-4 mb-4">
            {categories.map(category => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${
                  selectedCategory === category
                    ? `bg-gradient-to-r ${getCategoryColor(category)} text-white shadow-lg scale-105`
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {getCategoryIcon(category)}
                <span className="capitalize font-medium">{category}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add a new task..."
              className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              type="submit"
              className={`px-6 py-3 rounded-xl bg-gradient-to-r ${getCategoryColor(selectedCategory)} text-white font-medium hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg`}
            >
              <Plus className="w-5 h-5" />
              Add Task
            </button>
          </div>
        </form>

        {/* Tasks List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            {categories.map(category => {
              const categoryTasks = tasks.filter(task => task.category === category);
              if (categoryTasks.length === 0) return null;

              return (
                <div key={category} className="bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${getCategoryColor(category)}`}>
                      {getCategoryIcon(category)}
                    </div>
                    <h2 className="text-xl font-semibold text-white capitalize">{category}</h2>
                  </div>
                  <SortableContext items={categoryTasks} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {categoryTasks.map(task => (
                        <SortableTask
                          key={task.id}
                          task={task}
                          onToggle={() => toggleTask(task.id)}
                          onDelete={() => deleteTask(task.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </div>
              );
            })}
          </DndContext>
        </div>
      </div>
    </div>
  );
}

export default App;
